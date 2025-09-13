# Winternal Web UI

A simple single-page application (SPA) that provides a web interface for the Winternal documentation assistant powered by Inkeep agents.

## Features

- **Two-column layout**: Clean, intuitive interface
- **Documentation URL management**: Add and manage internal documentation sources
- **AI-powered chat interface**: Interact with the Inkeep agent for code generation
- **Real-time processing**: Full integration with librarian and code generation agents

## Usage

1. **Add Documentation URLs**: In the left column, paste URLs to your internal documentation sources
2. **Ask for Code Generation**: In the right column, describe what you want to build
3. **Get AI-Generated Code**: The agent will fetch documentation, analyze it, and generate appropriate code

## Example Workflow

1. Add documentation URLs like:
   - `https://docs.yourcompany.com/api`
   - `https://internal.docs.com/components`
   - `https://wiki.company.com/patterns`

2. Ask questions like:
   - "Create a React component that uses our API"
   - "Generate a function to authenticate users based on our docs"
   - "Show me how to implement data validation following our patterns"

3. The agent will:
   - Fetch and analyze your documentation
   - Extract relevant code examples and patterns
   - Generate code that follows your documentation's conventions

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

The web UI runs on http://localhost:3001 by default.

## Integration

The web UI communicates with:
- **Management API** (port 3002): For creating agent sessions
- **Runtime API** (port 3003): For sending messages and receiving responses
- **Documentation MCP Server**: For fetching and analyzing documentation

Make sure all backend services are running before using the web UI.
