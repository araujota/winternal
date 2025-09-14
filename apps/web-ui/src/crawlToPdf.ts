// crawlToPdf.ts
// TypeScript: Crawl an HTML docs site -> render each page to PDF with browser APIs -> merge into one PDF.
// Usage example:
//   await crawlSiteToPdf("https://example.com/docs/", "docs.pdf", { maxPages: 300, waitMs: 250 });

import axios from "axios";
import * as cheerio from "cheerio";
import { PDFDocument, rgb } from "pdf-lib";

type Options = {
  maxPages?: number;          // max pages to include
  sameOriginOnly?: boolean;   // restrict crawl to same scheme+host
  waitMs?: number;            // extra delay after page load for JS-rendered content
  pdfFormat?: "A4" | "Letter";
  scale?: number;             // 0.1–2.0
  filter?: (url: string) => boolean; // optional custom filter to include/exclude URLs
};

const DEFAULTS: Required<Options> = {
  maxPages: 200,
  sameOriginOnly: true,
  waitMs: 0,
  pdfFormat: "A4",
  scale: 1.0,
  filter: () => true,
};

function normalizeUrl(u: string): string {
  const p = new URL(u);
  p.hash = "";
  return p.toString();
}

function isSameOrigin(a: string, b: string): boolean {
  const A = new URL(a);
  const B = new URL(b);
  return A.protocol === B.protocol && A.host === B.host;
}

function shouldSkip(url: string): boolean {
  // Exclude typical non-content paths / assets. Adjust as needed.
  return /(\.(png|jpe?g|gif|svg|ico|pdf|zip|mp4|webm|mp3)$)|\/(search|tags?|category|assets|_next|static|fonts?)\b/i.test(
    url
  );
}

async function tryFetch(url: string, timeoutMs = 10000): Promise<{ ok: boolean; text?: string; type?: string }> {
  try {
    // Try direct fetch first
    let r;
    try {
      r = await axios.get(url, { timeout: timeoutMs, responseType: "text", validateStatus: () => true });
    } catch (corsError) {
      console.log(`CORS error for ${url}, trying proxy...`);
      // Try with CORS proxy
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const proxyResponse = await axios.get(proxyUrl, { timeout: timeoutMs });
      
      if (proxyResponse.data && proxyResponse.data.contents) {
        r = {
          status: 200,
          data: proxyResponse.data.contents,
          headers: { "content-type": "text/html" }
        };
      } else {
        return { ok: false };
      }
    }
    
    return { ok: r.status >= 200 && r.status < 300, text: r.data, type: r.headers["content-type"] || "" };
  } catch {
    return { ok: false };
  }
}

async function urlsFromSitemap(seed: string): Promise<string[]> {
  const base = new URL(seed);
  const candidates = [new URL("sitemap.xml", seed).toString(), `${base.protocol}//${base.host}/sitemap.xml`];
  for (const sm of candidates) {
    const res = await tryFetch(sm);
    if (res.ok && /xml/i.test(res.type || "") && res.text) {
      try {
        const $ = cheerio.load(res.text, { xmlMode: true });
        const locs = $("url > loc")
          .map((_: number, el: any) => normalizeUrl($(el).text().trim()))
          .get();
        if (locs.length) return locs;
      } catch {
        // ignore parse errors, try next
      }
    }
  }
  return [];
}

async function discoverUrls(seed: string, maxPages: number, sameOriginOnly: boolean, filter: (url: string) => boolean): Promise<string[]> {
  // Prefer sitemap ordering; fall back to BFS
  const sm = await urlsFromSitemap(seed);
  if (sm.length) {
    const base = new URL(seed);
    const list = sm
      .filter(u => (!sameOriginOnly || isSameOrigin(seed, u)) && !shouldSkip(u) && filter(u) && u.startsWith(base.origin));
    return list.slice(0, maxPages);
  }

  const seen = new Set<string>();
  const out: string[] = [];
  const q: string[] = [seed];
  const base = new URL(seed).origin;

  while (q.length && out.length < maxPages) {
    const url = normalizeUrl(q.shift()!);
    if (seen.has(url) || shouldSkip(url) || (sameOriginOnly && !url.startsWith(base)) || !filter(url)) continue;
    seen.add(url);

    const res = await tryFetch(url, 15000);
    if (!res.ok || !/text\/html/i.test(res.type || "") || !res.text) continue;

    out.push(url);

    const $ = cheerio.load(res.text);
    const links = $("a[href]")
      .map((_: number, a: any) => new URL($(a).attr("href")!, url).toString())
      .get()
      .map(normalizeUrl);
    for (const nxt of links) {
      if (!seen.has(nxt) && !shouldSkip(nxt) && (!sameOriginOnly || nxt.startsWith(base))) {
        q.push(nxt);
      }
    }
  }
  return out;
}


async function renderPageToPdf(url: string, i: number, total: number): Promise<Uint8Array | null> {
  try {
    console.log(`[${i}/${total}] Fetching and rendering ${url}...`);
    
    // Fetch the HTML content
    let response;
    try {
      response = await axios.get(url, { 
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
    } catch (corsError: any) {
      console.log(`CORS error for ${url}, trying CORS proxy...`);
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const proxyResponse = await axios.get(proxyUrl, { timeout: 30000 });
      
      if (proxyResponse.data && proxyResponse.data.contents) {
        response = {
          status: 200,
          data: proxyResponse.data.contents
        };
      } else {
        throw new Error(`CORS proxy failed: ${corsError.message}`);
      }
    }
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Parse and render HTML with proper styling preservation
    const pdfDoc = await PDFDocument.create();
    
    try {
      await renderHtmlToPdf(pdfDoc, response.data, url);
    } catch (htmlError) {
      console.warn(`HTML processing failed for ${url}, using fallback:`, htmlError);
      // Fallback to simple text extraction
      await renderFallbackPdf(pdfDoc, response.data, url);
    }
    
    const pdfBytes = await pdfDoc.save();
    return new Uint8Array(pdfBytes);
    
  } catch (e) {
    console.error(`! Render failed for ${url}:`, (e as Error).message);
    return null;
  }
}

async function renderHtmlToPdf(pdfDoc: PDFDocument, html: string, url: string): Promise<void> {
  try {
    console.log(`Processing HTML for ${url}...`);
    const $ = cheerio.load(html);
    
    // Remove unwanted elements but keep structure
    $('script, style, nav, footer, .md-header, .md-footer, .md-sidebar, .md-nav, .md-search, .md-tabs').remove();
    
    // Find main content with better fallback
    let mainContent = $('.md-content__inner').first();
    if (mainContent.length === 0) {
      mainContent = $('.md-content').first();
    }
    if (mainContent.length === 0) {
      mainContent = $('main').first();
    }
    if (mainContent.length === 0) {
      mainContent = $('.content').first();
    }
    if (mainContent.length === 0) {
      mainContent = $('article').first();
    }
    if (mainContent.length === 0) {
      mainContent = $('body');
    }
    
    console.log(`Found main content: ${mainContent.length > 0 ? 'Yes' : 'No'}`);
    
    if (mainContent.length === 0) {
      throw new Error('No main content found');
    }
    
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    const contentWidth = width - 2 * margin;
    let currentY = height - margin;
    
    // Page title and URL
    const title = $('title').text() || $('h1').first().text() || new URL(url).pathname;
    console.log(`Page title: ${title}`);
    
    currentY = drawStyledText(page, title, {
      x: margin,
      y: currentY,
      size: 18,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: contentWidth
    });
    
    currentY -= 10;
    
    currentY = drawStyledText(page, url, {
      x: margin,
      y: currentY,
      size: 9,
      color: rgb(0.6, 0.6, 0.6),
      maxWidth: contentWidth
    });
    
    currentY -= 20;
    
    // Process content elements in order
    processContentElements(page, pdfDoc, $, mainContent, margin, currentY, contentWidth);
    console.log(`Successfully processed content for ${url}`);
    
  } catch (error) {
    console.error(`Error processing HTML for ${url}:`, error);
    throw error;
  }
}

function processContentElements(page: any, pdfDoc: PDFDocument, $: any, content: any, margin: number, startY: number, contentWidth: number): number {
  let currentY = startY;
  let currentPage = page;
  
  try {
    // Extract text content with basic structure preservation
    const elements: Array<{ type: string; text: string }> = [];
    
    // Find headings
    content.find('h1, h2, h3, h4, h5, h6').each((_: number, el: any) => {
      const text = $(el).text().trim();
      if (text) {
        elements.push({ type: el.tagName.toLowerCase(), text });
      }
    });
    
    // Find paragraphs
    content.find('p').each((_: number, el: any) => {
      const text = $(el).text().trim();
      if (text && text.length > 10) {
        elements.push({ type: 'p', text });
      }
    });
    
    // Find code blocks
    content.find('pre, code').each((_: number, el: any) => {
      const text = $(el).text().trim();
      if (text && text.length > 3) {
        elements.push({ type: 'code', text });
      }
    });
    
    // Find list items
    content.find('li').each((_: number, el: any) => {
      const text = $(el).text().trim();
      if (text) {
        elements.push({ type: 'li', text });
      }
    });
    
    // If no structured content found, get all text
    if (elements.length === 0) {
      const allText = content.text().trim();
      if (allText) {
        // Split into paragraphs
        const paragraphs = allText.split('\n').filter((p: string) => p.trim().length > 10);
        paragraphs.forEach((text: string) => {
          elements.push({ type: 'p', text: text.trim() });
        });
      }
    }
    
    console.log(`Found ${elements.length} content elements to render`);
    
    // Render elements
    for (const element of elements.slice(0, 20)) { // Limit to prevent huge PDFs
      const { type, text } = element;
      
      // Check if we need a new page
      if (currentY < margin + 100) {
        currentPage = pdfDoc.addPage();
        currentY = currentPage.getSize().height - margin;
      }
      
      let style: any = {
        x: margin,
        y: currentY,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
        maxWidth: contentWidth
      };
      
      let processedText = text;
      
      switch (type) {
        case 'h1':
          style = { ...style, size: 16, color: rgb(0.1, 0.1, 0.1) };
          currentY -= 15; // Extra space before heading
          break;
        case 'h2':
          style = { ...style, size: 14, color: rgb(0.2, 0.2, 0.2) };
          currentY -= 12;
          break;
        case 'h3':
          style = { ...style, size: 13, color: rgb(0.3, 0.3, 0.3) };
          currentY -= 10;
          break;
        case 'h4':
        case 'h5':
        case 'h6':
          style = { ...style, size: 12, color: rgb(0.4, 0.4, 0.4) };
          currentY -= 8;
          break;
        case 'code':
          // Draw background for code
          const lines = text.split('\n').length;
          const codeHeight = Math.max(lines * 14, 25);
          
          currentPage.drawRectangle({
            x: margin - 5,
            y: currentY - codeHeight + 5,
            width: contentWidth + 10,
            height: codeHeight,
            color: rgb(0.96, 0.96, 0.96),
          });
          
          style = { ...style, size: 9, color: rgb(0.1, 0.1, 0.1) };
          break;
        case 'li':
          style = { ...style, size: 10, color: rgb(0.2, 0.2, 0.2) };
          processedText = `• ${text}`;
          break;
        case 'p':
        default:
          style = { ...style, size: 10, color: rgb(0.3, 0.3, 0.3) };
      }
      
      // Update current Y position
      style.y = currentY;
      
      currentY = drawStyledText(currentPage, processedText, style) - 8;
    }
    
    return currentY;
    
  } catch (error) {
    console.error('Error processing content elements:', error);
    return currentY;
  }
}

function drawStyledText(page: any, text: string, style: any): number {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const charWidth = style.size * 0.5; // Approximate character width
  const maxCharsPerLine = Math.floor(style.maxWidth / charWidth);
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    if (testLine.length > maxCharsPerLine && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  let y = style.y;
  const lineHeight = style.size + 4;
  
  for (const line of lines) {
    page.drawText(line, {
      x: style.x,
      y: y,
      size: style.size,
      color: style.color,
    });
    y -= lineHeight;
  }
  
  return y - 5; // Extra spacing after block
}

async function renderFallbackPdf(pdfDoc: PDFDocument, html: string, url: string): Promise<void> {
  console.log(`Using fallback PDF rendering for ${url}`);
  
  const $ = cheerio.load(html);
  
  // Remove unwanted elements
  $('script, style, nav, footer, .md-header, .md-footer, .md-sidebar, .md-nav').remove();
  
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  const contentWidth = width - 2 * margin;
  let currentY = height - margin;
  
  // Title
  const title = $('title').text() || $('h1').first().text() || 'Documentation Page';
  currentY = drawStyledText(page, title, {
    x: margin,
    y: currentY,
    size: 16,
    color: rgb(0.1, 0.1, 0.1),
    maxWidth: contentWidth
  });
  
  currentY -= 10;
  
  // URL
  currentY = drawStyledText(page, url, {
    x: margin,
    y: currentY,
    size: 9,
    color: rgb(0.6, 0.6, 0.6),
    maxWidth: contentWidth
  });
  
  currentY -= 20;
  
  // Simple text content
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  if (bodyText) {
    const chunks = bodyText.substring(0, 2000).split(' '); // Limit text
    let currentLine = '';
    
    for (const word of chunks) {
      if (currentLine.length + word.length > 80 && currentLine) {
        currentY = drawStyledText(page, currentLine, {
          x: margin,
          y: currentY,
          size: 10,
          color: rgb(0.3, 0.3, 0.3),
          maxWidth: contentWidth
        });
        currentLine = word + ' ';
        
        if (currentY < margin + 50) break; // Stop if running out of space
      } else {
        currentLine += word + ' ';
      }
    }
    
    // Add remaining text
    if (currentLine.trim() && currentY >= margin + 50) {
      drawStyledText(page, currentLine, {
        x: margin,
        y: currentY,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
        maxWidth: contentWidth
      });
    }
  }
}




/**
 * Crawl an HTML docs site and export a single combined PDF for browser download.
 */
export async function crawlSiteToPdf(seedUrl: string, outputPdfPath: string, opts: Options = {}): Promise<void> {
  const o = { ...DEFAULTS, ...opts };
  const seed = normalizeUrl(seedUrl);
  if (!/^https?:\/\//i.test(seed)) throw new Error("Seed must be an http(s) URL");

  console.log(`Starting crawl of ${seed}...`);
  const urls = await discoverUrls(seed, o.maxPages, o.sameOriginOnly, o.filter!);
  console.log(`Discovered ${urls.length} URLs:`, urls);

  if (!urls.length) throw new Error("No crawlable HTML pages were discovered. This might be due to CORS restrictions or the site structure.");

  const pdfBuffers: Uint8Array[] = [];
  for (let i = 0; i < urls.length; i++) {
    const buf = await renderPageToPdf(urls[i], i + 1, urls.length);
    if (buf) pdfBuffers.push(buf);
  }

  console.log(`Successfully rendered ${pdfBuffers.length} out of ${urls.length} pages`);
  if (!pdfBuffers.length) throw new Error(`No pages could be rendered to PDF. Attempted to process ${urls.length} URLs but all failed. Check browser console for detailed errors.`);

  // Merge PDFs with pdf-lib
  const merged = await PDFDocument.create();
  for (const buf of pdfBuffers) {
    try {
      const src = await PDFDocument.load(buf);
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p: any) => merged.addPage(p));
    } catch (e) {
      console.error(`! Skipping a PDF buffer: ${(e as Error).message}`);
    }
  }

  const mergedBytes = await merged.save();
  
  // Create download in browser
  const blob = new Blob([mergedBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = outputPdfPath;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`✅ Downloaded ${outputPdfPath} (${urls.length} page(s) discovered, ${pdfBuffers.length} rendered)`);
}

// Browser-compatible PDF generation from crawled documentation sites
