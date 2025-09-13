# winternal

An Inkeep Agent Framework project with multi-service architecture.

## Architecture

This project follows a workspace structure with the following services:

- **Web UI** (Port 3001): Simple documentation assistant interface
  - Two-column SPA for managing documentation URLs and chatting with AI agents
- **Agents Manage API** (Port 3002): Agent configuration and management
  - Handles entity management and configuration endpoints.
- **Agents Run API** (Port 3003): Agent execution and chat processing  
  - Handles agent communication. You can interact with your agents either over MCP from an MCP client or through our React UI components library
- **Agents Manage UI** (Port 3000): Web interface available via `inkeep dev`
  - The agent framework visual builder. From the builder you can create, manage and visualize all your graphs.

## Quick Start
1. **Install the Inkeep CLI:**
   ```bash
   pnpm install -g @inkeep/agents-cli
   ```

1. **Start services:**
   ```bash
   # Start Agents Manage API and Agents Run API
   pnpm dev
   
   # Start the Dashboard
   inkeep dev
   ```

3. **Deploy your agent graphs:**
   ```bash
   # Navigate to your project's graph directory
   cd src/winternal/
   
   # Push the weather graph to create it
   inkeep push weather.graph.ts
   
   # Push the librarian graph to create it
   inkeep push librarian.graph.ts
   ```
  - Follow the prompts to create the project and graph
  - Click on the "View graph in UI:" link to see the graph in the management dashboard

4. **Use the Web UI:**
   - Navigate to http://localhost:3001 to access the simple web interface
   - Add documentation URLs in the left column
   - Chat with the AI assistant in the right column for code generation

## Project Structure

```
winternal/
├── src/
│   ├── /winternal              # Agent configurations
├── apps/
│   ├── manage-api/          # Agents Manage API service
│   ├── run-api/             # Agents Run API service
│   └── shared/              # Shared code between API services
│       └── credential-stores.ts  # Shared credential store configuration
├── turbo.json               # Turbo configuration
├── pnpm-workspace.yaml      # pnpm workspace configuration
└── package.json             # Root package configuration
```

## Configuration

### Environment Variables

Environment variables are defined in the following places:

- `apps/manage-api/.env`: Agents Manage API environment variables
- `apps/run-api/.env`: Agents Run API environment variables
- `src/winternal/.env`: Inkeep CLI environment variables
- `.env`: Root environment variables 

To change the API keys used by your agents modify `apps/run-api/.env`. You are required to define at least one LLM provider key.

```bash
# AI Provider Keys
ANTHROPIC_API_KEY=your-anthropic-key-here
OPENAI_API_KEY=your-openai-key-here
```



### Agent Configuration

Your graphs are defined in `src/winternal/`. The default setup includes:

- **Weather Graph** (`weather.graph.ts`): A graph that can forecast the weather in a given location.
- **Librarian Graph** (`librarian.graph.ts`): A documentation-aware code generation assistant that can reference online documentation to help with code generation tasks.

Your inkeep configuration is defined in `src/winternal/inkeep.config.ts`. The inkeep configuration is used to configure defaults for the inkeep CLI. The configuration includes:

- `tenantId`: The tenant ID
- `projectId`: The project ID
- `agentsManageApiUrl`: The Manage API URL
- `agentsRunApiUrl`: The Run API URL


## Using the Librarian Agent with MCP Server

The Librarian Agent now works with a dedicated MCP (Model Context Protocol) server that provides documentation search capabilities. This allows Cline to directly access documentation tools for code generation.

### Architecture Overview

1. **Documentation MCP Server**: A standalone server that can fetch, parse, and search documentation from URLs
2. **Librarian Agents**: Inkeep agents that use the MCP server for documentation research and code generation
3. **Cline Integration**: Cline connects to the MCP server to access documentation tools directly

### Setting Up the MCP Server

1. **Build the MCP Server**:
   ```bash
   pnpm mcp:build
   ```

2. **Configure Cline to use the MCP Server**:
   - Copy the `cline-mcp-config.json` to your Cline MCP configuration
   - Or manually add the server in Cline's MCP settings:
     ```json
     {
       "mcpServers": {
         "documentation-search": {
           "command": "node",
           "args": ["/path/to/winternal/apps/documentation-mcp-server/dist/index.js"],
           "env": {}
         }
       }
     }
     ```

3. **Start the MCP Server** (if running standalone):
   ```bash
   pnpm mcp:start
   ```

### Available MCP Tools for Cline

When connected to the MCP server, Cline will have access to these tools:

1. **fetch_documentation**: Fetch and parse documentation from any URL
   - Parameters: `url` (required), `selector` (optional CSS selector)
   - Returns: Parsed documentation content

2. **search_documentation**: Search through documentation content
   - Parameters: `query`, `content`, `maxResults`
   - Returns: Relevant sections ranked by relevance

3. **extract_code_examples**: Extract code examples from documentation
   - Parameters: `content`, `language` (optional)
   - Returns: Code examples with language detection and context

### Example Workflow

```
1. User asks Cline: "Use the Stripe API documentation to create a payment intent function"

2. Cline uses fetch_documentation tool:
   - URL: https://stripe.com/docs/api/payment_intents/create
   - Gets structured documentation content

3. Cline uses search_documentation tool:
   - Query: "create payment intent parameters"
   - Finds relevant sections about required parameters

4. Cline uses extract_code_examples tool:
   - Extracts JavaScript/Node.js examples from the docs

5. Cline generates code using the documentation context:
   - Follows exact API patterns from docs
   - Includes proper error handling
   - Uses correct parameter names and types
```

### Benefits of MCP Architecture

- **Direct Access**: Cline can fetch documentation in real-time
- **Always Current**: No need to manually copy/paste documentation
- **Comprehensive**: Can search and extract specific information as needed
- **Efficient**: Caches documentation to avoid repeated fetches
- **Flexible**: Works with any documentation URL

## Development

### Updating Your Agents

1. Edit the graph files in `src/winternal/`
2. Push the graph to the platform to update: 
   - `inkeep push weather.graph.ts`
   - `inkeep push librarian.graph.ts` 

### API Documentation

Once services are running, view the OpenAPI documentation:

- Manage API: http://localhost:3002/docs
- Run API: http://localhost:3003/docs

## Learn More

- [Inkeep Documentation](https://docs.inkeep.com)

## Troubleshooting

## Inkeep CLI commands

- Ensure you are runnning commands from `cd src/winternal`.
- Validate the `inkeep.config.ts` file has the correct api urls.
- Validate that the `.env` file in `src/winternal` has the correct `DB_FILE_NAME`.

### Services won't start

1. Ensure all dependencies are installed: `pnpm install`
2. Check that ports 3000-3003 are available

### Agents won't respond

1. Ensure that the Agents Run API is running and includes a valid Anthropic or OpenAI API key in its .env file
