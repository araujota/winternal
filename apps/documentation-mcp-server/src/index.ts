#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { z } from 'zod';

// Tool input schemas
const FetchDocumentationSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  selector: z.string().optional().describe('CSS selector to extract specific content'),
});

const SearchDocumentationSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  content: z.string().min(1, 'Content to search cannot be empty'),
  maxResults: z.number().int().positive().max(20).default(5),
});

class DocumentationMCPServer {
  private server: Server;
  private documentationCache: Map<string, string> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'documentation-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'fetch_documentation',
            description: 'Fetch and parse documentation from a URL',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  format: 'uri',
                  description: 'The URL of the documentation to fetch',
                },
                selector: {
                  type: 'string',
                  description: 'Optional CSS selector to extract specific content (e.g., ".content", "#main", "article")',
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'search_documentation',
            description: 'Search through fetched documentation content',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query to find relevant sections',
                },
                content: {
                  type: 'string',
                  description: 'The documentation content to search through',
                },
                maxResults: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 5, max: 20)',
                  minimum: 1,
                  maximum: 20,
                },
              },
              required: ['query', 'content'],
            },
          },
          {
            name: 'extract_code_examples',
            description: 'Extract code examples from documentation content',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'The documentation content to extract code examples from',
                },
                language: {
                  type: 'string',
                  description: 'Optional: filter by programming language (e.g., javascript, python, typescript)',
                },
              },
              required: ['content'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'fetch_documentation':
            return await this.fetchDocumentation(args);
          case 'search_documentation':
            return await this.searchDocumentation(args);
          case 'extract_code_examples':
            return await this.extractCodeExamples(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async fetchDocumentation(args: any) {
    const { url, selector } = FetchDocumentationSchema.parse(args);

    try {
      // Check cache first
      const cacheKey = `${url}:${selector || 'full'}`;
      if (this.documentationCache.has(cacheKey)) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                url,
                cached: true,
                content: this.documentationCache.get(cacheKey),
                timestamp: new Date().toISOString(),
              }, null, 2),
            },
          ],
        };
      }

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Documentation-MCP-Server/0.1.0',
        },
      });

      const root = parse(response.data);
      let content: string;

      if (selector) {
        const selectedElements = root.querySelectorAll(selector);
        content = selectedElements.map(el => el.text).join('\n\n');
        if (!content) {
          content = `No content found with selector: ${selector}`;
        }
      } else {
        // Remove script and style tags, get main content
        root.querySelectorAll('script, style, nav, footer, aside').forEach(el => el.remove());
        content = root.text;
      }

      // Clean up the content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      // Cache the result
      this.documentationCache.set(cacheKey, content);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              url,
              selector: selector || null,
              content,
              contentLength: content.length,
              timestamp: new Date().toISOString(),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch documentation from ${url}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async searchDocumentation(args: any) {
    const { query, content, maxResults } = SearchDocumentationSchema.parse(args);

    try {
      const searchTerms = query.toLowerCase().split(/\s+/);
      const sections = content.split(/\n\s*\n/);
      
      const results = sections
        .map((section, index) => {
          const lowerSection = section.toLowerCase();
          const matches = searchTerms.filter(term => lowerSection.includes(term));
          const score = matches.length / searchTerms.length;
          
          return {
            section: section.trim(),
            score,
            index,
            matchedTerms: matches,
          };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query,
              totalSections: sections.length,
              resultsFound: results.length,
              results: results.map(r => ({
                content: r.section,
                relevanceScore: r.score,
                matchedTerms: r.matchedTerms,
              })),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to search documentation: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async extractCodeExamples(args: any) {
    const { content, language } = z.object({
      content: z.string(),
      language: z.string().optional(),
    }).parse(args);

    try {
      // Parse HTML to find code blocks
      const root = parse(content);
      const codeBlocks: Array<{ code: string; language?: string; context?: string }> = [];

      // Find code elements
      root.querySelectorAll('code, pre').forEach(element => {
        const code = element.text.trim();
        if (code.length > 10) { // Filter out very short snippets
          const classes = element.getAttribute('class') || '';
          const detectedLanguage = this.detectLanguageFromClass(classes) || this.detectLanguageFromContent(code);
          
          // Get surrounding context
          const parent = element.parentNode;
          const context = parent ? parent.text.substring(0, 200) : '';
          
          if (!language || detectedLanguage === language) {
            codeBlocks.push({
              code,
              language: detectedLanguage,
              context: context !== code ? context : undefined,
            });
          }
        }
      });

      // Also look for code patterns in plain text
      const codePatterns = [
        /```(\w+)?\n([\s\S]*?)```/g,
        /`([^`\n]+)`/g,
      ];

      for (const pattern of codePatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const [, lang, code] = match;
          if (code && code.trim().length > 10) {
            if (!language || lang === language) {
              codeBlocks.push({
                code: code.trim(),
                language: lang,
              });
            }
          }
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              language: language || 'any',
              totalExamples: codeBlocks.length,
              examples: codeBlocks,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to extract code examples: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private detectLanguageFromClass(className: string): string | undefined {
    const langPatterns = [
      /language-(\w+)/,
      /lang-(\w+)/,
      /highlight-(\w+)/,
      /(\w+)-code/,
    ];

    for (const pattern of langPatterns) {
      const match = className.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    return undefined;
  }

  private detectLanguageFromContent(code: string): string | undefined {
    // Simple language detection based on common patterns
    if (/^import\s+.*from\s+['"]/.test(code) || /^const\s+\w+\s*=/.test(code)) {
      return 'javascript';
    }
    if (/^from\s+\w+\s+import/.test(code) || /^def\s+\w+\(/.test(code)) {
      return 'python';
    }
    if (/^interface\s+\w+/.test(code) || /:\s*\w+\[\]/.test(code)) {
      return 'typescript';
    }
    if (/^#include\s*</.test(code) || /^int\s+main\(/.test(code)) {
      return 'cpp';
    }
    
    return undefined;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Documentation MCP server running on stdio');
  }
}

const server = new DocumentationMCPServer();
server.run().catch(console.error);
