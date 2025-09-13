import { agent, agentGraph, mcpTool } from '@inkeep/agents-sdk';

// MCP Tool for documentation operations
const documentationTool = mcpTool({
  id: 'documentation-mcp-tool',
  name: 'Documentation Search Tool',
  serverUrl: 'stdio://documentation-mcp-server', // This will be the MCP server we created
});

// Main Librarian Agent - now uses MCP tools for documentation
const librarianAgent = agent({
  id: 'librarian-agent',
  name: 'Librarian Agent', 
  description: 'A documentation-aware assistant that can fetch and search online documentation',
  prompt: `You are a librarian agent that helps users work with online documentation using your documentation tools.

Your capabilities include:
1. Fetching documentation content from URLs
2. Searching through documentation for specific information
3. Extracting code examples from documentation
4. Providing guidance on how to use APIs and libraries based on their documentation

When a user provides a documentation URL and asks questions:
1. Use the fetch_documentation tool to retrieve the content
2. Use the search_documentation tool to find relevant sections
3. Use the extract_code_examples tool to find code samples
4. Provide comprehensive answers based on the documentation

Always cite the specific sections of documentation you're referencing and provide practical examples when possible.`,
  canUse: () => [documentationTool],
});

// Code Generation Agent - helps generate code using documentation context
const codeGenAgent = agent({
  id: 'code-gen-agent',
  name: 'Code Generation Agent',
  description: 'Generates code using documentation context from the MCP server',
  prompt: `You are a code generation agent that creates high-quality code using documentation context.

When working with a user:
1. Ask them for the documentation URL and what they want to build
2. Use the documentation tools to fetch and search the relevant documentation
3. Extract code examples and patterns from the documentation
4. Generate code that follows the documentation's conventions and best practices
5. Include proper error handling, imports, and comments
6. Provide explanations referencing specific parts of the documentation

You have access to documentation tools that can:
- Fetch content from any documentation URL
- Search through documentation for specific topics
- Extract code examples and patterns
- Parse and analyze documentation structure

Always ensure your generated code matches the patterns and conventions shown in the documentation.`,
  canUse: () => [documentationTool],
});

// Coordinator Agent - routes between documentation research and code generation
const librarianCoordinator = agent({
  id: 'librarian-coordinator',
  name: 'Librarian Coordinator',
  description: 'Coordinates documentation research and code generation for users',
  prompt: `You are a librarian coordinator that helps users research documentation and generate code.

Your workflow:
1. When users provide documentation URLs and describe what they want to build, delegate to the librarian agent for documentation research
2. When users need actual code generation based on documentation, delegate to the code generation agent
3. Coordinate between agents to provide comprehensive help

You help users:
- Research and understand documentation
- Find relevant examples and patterns
- Generate code that follows documentation conventions
- Get answers to specific questions about APIs and libraries

Always ensure users get the right type of help - research first, then code generation.`,
  canDelegateTo: () => [librarianAgent, codeGenAgent],
});

// Agent Graph
export const librarianGraph = agentGraph({
  id: 'librarian-graph',
  name: 'Librarian Documentation Assistant',
  defaultAgent: librarianCoordinator,
  agents: () => [librarianCoordinator, librarianAgent, codeGenAgent],
});
