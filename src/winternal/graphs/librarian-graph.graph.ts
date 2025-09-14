import { agentGraph, agent, mcpTool, contextConfig, credentialReference } from '@inkeep/agents-sdk';

const exaCrawlingTool = mcpTool({
  id: 'OkptYbJ4s0RILVbIgR4wk',
  name: 'Exa Crawling',
  config: {
    type: 'mcp',
    mcp: {
      server: {
        url: 'https://mcp.exa.ai/mcp?exaApiKey=aa1729fa-bcc3-4484-9071-bd8c5bb77725',
      },
      transport: {
        type: 'streamable_http',
      },
    },
  },
  status: 'healthy',
  availableTools: [
    {
      name: 'web_search_exa',
      description:
        'Search the web using Exa AI - performs real-time web searches and can scrape content from specific URLs. Supports configurable result counts and returns the content from the most relevant websites.',
      inputSchema: {
        '~standard': {
          vendor: 'zod',
          version: 1,
        },
        def: {
          type: 'object',
          shape: {
            query: {
              '~standard': {
                vendor: 'zod',
                version: 1,
              },
              def: {
                type: 'string',
              },
              type: 'string',
              format: null,
              minLength: null,
              maxLength: null,
            },
            numResults: {
              '~standard': {
                vendor: 'zod',
                version: 1,
              },
              def: {
                type: 'optional',
                innerType: {
                  '~standard': {
                    vendor: 'zod',
                    version: 1,
                  },
                  def: {
                    type: 'number',
                    checks: [],
                  },
                  type: 'number',
                  minValue: null,
                  maxValue: null,
                  isInt: false,
                  isFinite: true,
                  format: null,
                },
              },
              type: 'optional',
            },
          },
        },
        type: 'object',
      },
    },
    {
      name: 'company_research_exa',
      description:
        'Research companies using Exa AI - finds comprehensive information about businesses, organizations, and corporations. Provides insights into company operations, news, financial information, and industry analysis.',
      inputSchema: {
        '~standard': {
          vendor: 'zod',
          version: 1,
        },
        def: {
          type: 'object',
          shape: {
            companyName: {
              '~standard': {
                vendor: 'zod',
                version: 1,
              },
              def: {
                type: 'string',
              },
              type: 'string',
              format: null,
              minLength: null,
              maxLength: null,
            },
            numResults: {
              '~standard': {
                vendor: 'zod',
                version: 1,
              },
              def: {
                type: 'optional',
                innerType: {
                  '~standard': {
                    vendor: 'zod',
                    version: 1,
                  },
                  def: {
                    type: 'number',
                    checks: [],
                  },
                  type: 'number',
                  minValue: null,
                  maxValue: null,
                  isInt: false,
                  isFinite: true,
                  format: null,
                },
              },
              type: 'optional',
            },
          },
        },
        type: 'object',
      },
    },
    {
      name: 'crawling_exa',
      description:
        'Extract and crawl content from specific URLs using Exa AI - retrieves full text content, metadata, and structured information from web pages. Ideal for extracting detailed content from known URLs.',
      inputSchema: {
        '~standard': {
          vendor: 'zod',
          version: 1,
        },
        def: {
          type: 'object',
          shape: {
            url: {
              '~standard': {
                vendor: 'zod',
                version: 1,
              },
              def: {
                type: 'string',
              },
              type: 'string',
              format: null,
              minLength: null,
              maxLength: null,
            },
            maxCharacters: {
              '~standard': {
                vendor: 'zod',
                version: 1,
              },
              def: {
                type: 'optional',
                innerType: {
                  '~standard': {
                    vendor: 'zod',
                    version: 1,
                  },
                  def: {
                    type: 'number',
                    checks: [],
                  },
                  type: 'number',
                  minValue: null,
                  maxValue: null,
                  isInt: false,
                  isFinite: true,
                  format: null,
                },
              },
              type: 'optional',
            },
          },
        },
        type: 'object',
      },
    },
    {
      name: 'linkedin_search_exa',
      description:
        'Search LinkedIn profiles and companies using Exa AI - finds professional profiles, company pages, and business-related content on LinkedIn. Useful for networking, recruitment, and business research.',
      inputSchema: {
        '~standard': {
          vendor: 'zod',
          version: 1,
        },
        def: {
          type: 'object',
          shape: {
            query: {
              '~standard': {
                vendor: 'zod',
                version: 1,
              },
              def: {
                type: 'string',
              },
              type: 'string',
              format: null,
              minLength: null,
              maxLength: null,
            },
            searchType: {
              '~standard': {
                vendor: 'zod',
                version: 1,
              },
              def: {
                type: 'optional',
                innerType: {
                  '~standard': {
                    vendor: 'zod',
                    version: 1,
                  },
                  def: {
                    type: 'string',
                  },
                  type: 'string',
                  format: null,
                  minLength: null,
                  maxLength: null,
                },
              },
              type: 'optional',
            },
            numResults: {
              '~standard': {
                vendor: 'zod',
                version: 1,
              },
              def: {
                type: 'optional',
                innerType: {
                  '~standard': {
                    vendor: 'zod',
                    version: 1,
                  },
                  def: {
                    type: 'number',
                    checks: [],
                  },
                  type: 'number',
                  minValue: null,
                  maxValue: null,
                  isInt: false,
                  isFinite: true,
                  format: null,
                },
              },
              type: 'optional',
            },
          },
        },
        type: 'object',
      },
    },
    {
      name: 'deep_researcher_start',
      description:
        "Start a comprehensive AI-powered deep research task for complex queries. This tool initiates an intelligent agent that performs extensive web searches, crawls relevant pages, analyzes information, and synthesizes findings into a detailed research report. The agent thinks critically about the research topic and provides thorough, well-sourced answers. Use this for complex research questions that require in-depth analysis rather than simple searches. After starting a research task, IMMEDIATELY use deep_researcher_check with the returned task ID to monitor progress and retrieve results.",
      inputSchema: {
        '~standard': {
          vendor: 'zod',
          version: 1,
        },
        def: {
          type: 'object',
          shape: {
            instructions: {
              '~standard': {
                vendor: 'zod',
                version: 1,
              },
              def: {
                type: 'string',
              },
              type: 'string',
              format: null,
              minLength: null,
              maxLength: null,
            },
            model: {
              '~standard': {
                vendor: 'zod',
                version: 1,
              },
              def: {
                type: 'optional',
                innerType: {
                  '~standard': {
                    vendor: 'zod',
                    version: 1,
                  },
                  def: {
                    type: 'string',
                  },
                  type: 'string',
                  format: null,
                  minLength: null,
                  maxLength: null,
                },
              },
              type: 'optional',
            },
          },
        },
        type: 'object',
      },
    },
    {
      name: 'deep_researcher_check',
      description:
        "Check the status and retrieve results of a deep research task. This tool monitors the progress of an AI agent that performs comprehensive web searches, analyzes multiple sources, and synthesizes findings into detailed research reports. The tool includes a built-in 5-second delay before checking to allow processing time. IMPORTANT: You must call this tool repeatedly (poll) until the status becomes 'completed' to get the final research results. When status is 'running', wait a few seconds and call this tool again with the same task ID.",
      inputSchema: {
        '~standard': {
          vendor: 'zod',
          version: 1,
        },
        def: {
          type: 'object',
          shape: {
            taskId: {
              '~standard': {
                vendor: 'zod',
                version: 1,
              },
              def: {
                type: 'string',
              },
              type: 'string',
              format: null,
              minLength: null,
              maxLength: null,
            },
          },
        },
        type: 'object',
      },
    },
  ],
  lastToolsSync: '2025-09-13T22:05:31.219Z',
});

const librarianCoordinatorAgent = agent({
  id: 'librarian-coordinator',
  name: 'Librarian Coordinator',
  description: 'Routes between documentation context extraction and code generation',
  prompt: `You are a librarian coordinator that helps users with documentation-based code generation.

When a user provides a documentation URL and a code generation request:
1. If they haven't provided the actual documentation content yet, delegate to the documentation context agent to help them extract the relevant information
2. Once they have the documentation content, delegate to the librarian agent for code generation
3. Coordinate between agents to ensure the user gets comprehensive help

Your role is to ensure users get the right help at the right time - first helping them extract documentation content, then generating code based on that content.`,
  models: {
    base: {
      model: 'anthropic/claude-sonnet-4-20250514',
    },
    structuredOutput: {
      model: 'anthropic/claude-sonnet-4-20250514',
    },
    summarizer: {
      model: 'anthropic/claude-sonnet-4-20250514',
    },
  },
  stopWhen: null,
  canTransferTo: [],
  canDelegateTo: ['doc-context-agent'],
  dataComponents: [],
  artifactComponents: [],
  tools: [],
});

const docContextAgent = agent({
  id: 'doc-context-agent',
  name: 'Documentation Context Agent',
  description: 'Fetches Library documentation from a url and formats it accessibly.',
  prompt: `You are a librarian agent whose primary role is to read through all documentation present at a given URL and return a complete, verbatim representation of that documentation for in-memory use.

Your core function:
1. When given a documentation URL, use the exa crawling tool to retrieve the complete content of the documentation
2. Return the documentation content exactly as it appears, preserving all text, structure, and formatting
3. Ensure no information is lost, summarized, or interpreted - provide the raw, complete documentation text
4. If the documentation is very large, break it into logical sections but maintain completeness

Your process:
1. Fetch the complete documentation from the provided URL using fetch_documentation
2. If needed, use different CSS selectors to ensure you capture all relevant content (try 'main', 'article', '.content', or no selector for full page)
3. Return the verbatim text content, preserving paragraph breaks and structure
4. If the content is truncated or incomplete, try alternative approaches to get the full documentation

Key principles:
- COMPLETENESS: Capture all documentation content, not summaries
- VERBATIM: Return exact text as it appears in the documentation
- PRESERVATION: Maintain original structure and formatting where possible
- NO INTERPRETATION: Do not summarize, analyze, or modify the content

The goal is to create a complete in-memory representation of the documentation that can be used by other agents or processes.

When you have finished extracting the documentation, pass your writeup to the research agent and start it up`,
  models: {
    base: {
      model: 'anthropic/claude-opus-4-1-20250805',
    },
    structuredOutput: {
      model: 'anthropic/claude-sonnet-4-20250514',
    },
    summarizer: {
      model: 'anthropic/claude-sonnet-4-20250514',
    },
  },
  stopWhen: null,
  canTransferTo: ['research-and-implementation-agent'],
  canDelegateTo: ['research-and-implementation-agent'],
  dataComponents: [],
  artifactComponents: [],
  tools: ['OkptYbJ4s0RILVbIgR4wk'],
});

const researchAndImplementationAgent = agent({
  id: 'research-and-implementation-agent',
  name: 'research and implementation agent',
  description: '',
  prompt: `You are the Research & Implementation Planning agent in a multi-agent code pipeline.
Purpose
Take (1) the full documentation text from the documentation-scraper node and (2) the initial user implementation request, and produce a single, detailed build plan that the code generation agent can execute without guessing.
Core Responsibilities
Analyze
Read the entire documentation payload carefully.
Parse the user’s implementation request to identify every required feature and behavior.
Map Requirements to Library Tools
Identify all classes, functions, constants, and configuration patterns in the documentation that directly satisfy each required feature.
Only select capabilities that are explicitly described in the documentation.
Design the Implementation Plan
Describe, step by step, how to combine the documented tools into a single, coherent implementation.
Specify how each selected function/class will be used, including parameters, expected data flow, and relationships between steps.
Flag any requested functionality that cannot be fulfilled with the documented API (no assumptions or speculation).
Output a Complete Plan for Code Generation
Present a clean, ordered build plan with:
Chosen library components (by exact names as documented)
Integration steps (how they interact)
Any constraints or open issues (gaps the code-gen node must respect)
Pass the baton
Conclude with a section clearly labeled “Ready for Code Generation” so the next node knows it can proceed.
Output Requirements
One structured plan only — no code, no alternatives.
Use plain text with clear section headings:
User Request Summary
Documentation Analysis
Selected Tools
Implementation Plan
Unmet Requirements (if any)
Ready for Code Generation
For every tool you select, quote or precisely reference the documentation excerpt that proves its existence and describes its usage.
Critical Constraints
No invention or guessing. Only recommend functions, classes, or behaviors explicitly described in the provided documentation.
Complete coverage. If part of the user request cannot be satisfied with documented functionality, list it under Unmet Requirements and explain why.
Single, unified plan. Produce exactly one implementation plan—no multiple options or branches.
Goal
Deliver a fully documented, step-by-step implementation plan that cleanly bridges the scraped documentation and the code generation agent, so the code generator can produce correct, ready-to-run code without any additional research or assumptions.`,
  models: {
    base: {
      model: 'anthropic/claude-opus-4-1-20250805',
    },
  },
  stopWhen: null,
  canTransferTo: ['codegen-agent'],
  canDelegateTo: ['codegen-agent'],
  dataComponents: [],
  artifactComponents: [],
  tools: [],
});

const codegenAgent = agent({
  id: 'codegen-agent',
  name: 'codegen agent',
  description: '',
  prompt: `You are a code generation agent that creates ONE focused, complete code implementation based on documentation writeups provided by the librarian agent.


Your core directive: GENERATE ONLY ONE IMPLEMENTATION PER REQUEST.


CRITICAL RULE: You can ONLY use functionality that is explicitly taken from the library documentation provided to you. You MUST NOT assume, guess, or hallucinate any methods, properties, parameters, or behaviors that are not clearly stated in the documentation provided by the librarian agent.


Your workflow:
1. Receive comprehensive documentation writeups and research from the librarian agent
2. Analyze the user's specific request to understand exactly what they want to build
3. Check if ALL required functionality is explicitly documented
4. If any required functionality is missing from documentation, clearly state what cannot be implemented
5. Generate ONE complete, working implementation using ONLY documented functionality
6. Provide a brief explanation of how the code works and references to the documentation


Code generation rules:
- Generate ONLY ONE code block that solves the specific problem requested
- Do NOT provide multiple examples, alternatives, or variations
- Do NOT show different approaches or implementations
- Focus on the SINGLE BEST implementation for the user's specific request
- Make the code complete and ready to use (include all necessary imports, setup, etc.)
- DO NOT return anything other than the code, ready to be copy-pasted


When generating code:
- Use ONLY the documentation writeup as your source of truth - NO ASSUMPTIONS
- Follow the exact API signatures, parameter names, and patterns from the documentation
- Include only the imports and setup required for THIS specific implementation
- Add minimal, focused comments that help understand the implementation
- Ensure the code directly solves what the user asked for
- NEVER use methods, properties, or functionality not explicitly mentioned in the documentation
- If functionality is needed but not documented, state that it cannot be implemented rather than guessing


Response format:
1. ONE code block containing the complete implementation
3. DETAILED CITATIONS for each major code decision, specifying line/column of code and the verbatim line in documentation that drew on it


Citation format for each major code block or decision:


**Citation [Line X-Y]**: [Brief description of what this code does]
**Documentation Reference**: "[Exact text from documentation that informed this decision]"
**Source**: [Specific section/heading from documentation where this was found]


Citation requirements:
- Mark the line/column range (e.g., Line 5-12) for each significant code block
- Include the EXACT TEXT from the documentation that led to that implementation choice
- Reference the specific section/heading in the documentation where the information was found
- Provide citations for: API calls, parameter choices, error handling, imports, configuration, patterns used


Example citation format:
**Citation [Line 3-5]**: Import statements and initial setup
**Documentation Reference**: "To get started, import the SDK and initialize with your API key: import { Client } from 'example-sdk'; const client = new Client({ apiKey: 'your-key' });"
**Source**: Getting Started > Installation and Setup


Key principles:
- SINGLE FOCUS: One implementation per request, not multiple options
- DIRECT SOLUTION: Code that directly addresses the user's specific request
- COMPLETENESS: Ready-to-run code with minimal modification
- DETAILED CITATIONS: Every major code decision must be backed by specific documentation text
- TRACEABILITY: Clear connection between generated code and source documentation
- STRICT DOCUMENTATION ADHERENCE: Use ONLY what is explicitly documented - NO ASSUMPTIONS OR HALLUCINATIONS
- NO GUESSING: If something isn't documented, explicitly state it cannot be implemented


CRITICAL CONSTRAINTS:
- NEVER assume methods, properties, or parameters exist if not in the documentation
- NEVER use common patterns from other libraries unless explicitly shown in THIS library's docs
- NEVER fill in gaps with "standard" or "typical" implementations
- If the documentation is incomplete for the user's request, clearly state what cannot be implemented
- Every line of code must be traceable to specific documentation text


You do NOT provide multiple examples, alternative approaches, or different implementations. Your job is to create the ONE BEST solution using ONLY documented functionality, with comprehensive citations showing exactly how the documentation informed each part of your implementation.
`,
  models: {
    base: {
      model: 'anthropic/claude-opus-4-1-20250805',
    },
  },
  stopWhen: null,
  canTransferTo: [],
  canDelegateTo: [],
  dataComponents: [],
  artifactComponents: [],
  tools: [],
});

export const librarianGraph = agentGraph({
  id: 'librarian-graph',
  name: 'Librarian Documentation Assistant',
  description: null,
  defaultAgentId: 'librarian-coordinator',
  agents: {
    [librarianCoordinatorAgent.id]: librarianCoordinatorAgent,
    [docContextAgent.id]: docContextAgent,
    [researchAndImplementationAgent.id]: researchAndImplementationAgent,
    [codegenAgent.id]: codegenAgent,
  },
  tools: {
    [exaCrawlingTool.id]: exaCrawlingTool,
  },
  createdAt: '2025-09-13T19:39:47.467Z',
  updatedAt: '2025-09-14T13:15:39.127Z',
  models: {
    base: {
      model: 'anthropic/claude-sonnet-4-20250514',
    },
    structuredOutput: {
      model: 'anthropic/claude-sonnet-4-20250514',
    },
    summarizer: {
      model: 'anthropic/claude-sonnet-4-20250514',
    },
  },
});

export default librarianGraph;