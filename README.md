# winternal

An Inkeep Agent Framework project with multi-service architecture.

## Architecture

This project follows a workspace structure with the following services:

- **Agents Manage API** (Port 3002): Agent configuration and managemen
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


## Using the Librarian Agent with Cline

The Librarian Agent is designed to help you prepare documentation context and instructions for Cline (the AI coding assistant) to generate high-quality code. Here's how the workflow works:

### How it Works

1. **Provide a Documentation URL**: Give the agent a URL to relevant documentation (API docs, library documentation, tutorials, etc.)
2. **Describe Your Code Generation Need**: Explain what you want to build or implement
3. **Get Documentation Extraction Guidance**: The Documentation Context Agent guides you through extracting relevant content
4. **Receive Cline-Ready Instructions**: The Cline Integration Agent formats everything into structured instructions you can copy to Cline
5. **Use with Cline**: Copy the formatted instructions to Cline for actual code generation

### Example Usage Flow

```
User: "I want to use the Stripe API to create a payment intent. Here's the documentation: https://stripe.com/docs/api/payment_intents/create"

Documentation Context Agent: "I'll help you extract the right information from the Stripe documentation. Please copy these specific sections:

1. The API endpoint and HTTP method
2. Required parameters (amount, currency, etc.)
3. Authentication headers required
4. Any code examples they provide
5. Error response formats

This will give us everything needed for Cline to generate proper Stripe integration code."

User: [Provides the extracted documentation content]

Cline Integration Agent: "Perfect! Here's the formatted context and instructions for Cline:

**Context for Cline:**
[Structured documentation content with API endpoints, parameters, examples]

**Instructions for Cline:**
Generate a Node.js function to create a Stripe payment intent with the following requirements:
- Use the Stripe SDK
- Include proper error handling for all documented error cases
- Add TypeScript types for parameters and responses
- Include JSDoc comments explaining each parameter
- Create both a basic version and an advanced version with options

**Additional Requirements:**
- Add input validation
- Include unit tests
- Add logging for debugging
- Handle network timeouts

[Copy this entire formatted output to Cline for code generation]"
```

### Best Practices

- **Be Specific About Requirements**: The more detailed your requirements, the better the Cline instructions will be
- **Include All Relevant Documentation**: Copy complete sections including examples, error cases, and best practices
- **Specify Your Tech Stack**: Mention your language, framework, testing preferences, etc.
- **Describe Your Use Case**: Context helps generate more appropriate and complete instructions for Cline
- **Review the Formatted Output**: Check the Cline instructions before copying them to ensure they match your needs

### Agent Workflow

The librarian system uses multiple specialized agents:

1. **Librarian Coordinator**: Routes your request to the appropriate agent
2. **Documentation Context Agent**: Helps you extract the right information from documentation
3. **Cline Integration Agent**: Formats everything into structured instructions for Cline
4. **Librarian Agent**: Provides direct help with documentation questions if needed

The end goal is always to provide you with comprehensive, well-formatted instructions that you can copy directly to Cline for code generation.

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
