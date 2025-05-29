# MCP (Model Context Protocol) Setup Guide

This guide explains how to use the California Injury Calculator with MCP for AI integrations.

## What is MCP?

Model Context Protocol (MCP) is a standard protocol that allows AI models (like Claude, GPT-4, etc.) to interact with external tools and services. Our MCP server exposes the injury calculator functionality as tools that AI models can use.

## Available MCP Tools

### 1. calculateSettlement
Calculates a complete settlement estimate based on comprehensive injury data.

**Parameters:**
- `demographics`: Age, occupation, annual income
- `accidentDetails`: Date, fault percentage, impact severity
- `injuries`: Primary injury, fractures, TBI, spinal issues
- `treatment`: Medical visits, procedures, surgeries
- `impact`: Work days missed, permanent impairment
- `insurance`: Policy limits, attorney representation

**Returns:** Settlement estimates (low/mid/high), factors, and explanation

### 2. estimateMedicalCosts
Estimates total medical costs based on treatment received.

**Parameters:**
- `treatment`: Object containing counts of various medical treatments

**Returns:** Estimated medical costs in dollars

### 3. analyzeCase
Analyzes a natural language description of an injury case.

**Parameters:**
- `caseDescription`: String describing the injury case

**Returns:** Key factors, severity assessment, and recommendations

## Deployment

### Deploy the MCP Server

```bash
# Deploy the MCP server as a separate worker
wrangler deploy functions/mcp-server.ts --name california-injury-mcp
```

Your MCP server will be available at:
`https://california-injury-mcp.YOUR-SUBDOMAIN.workers.dev`

## Testing the MCP Server

### 1. Health Check
```bash
curl https://california-injury-mcp.YOUR-SUBDOMAIN.workers.dev/health
```

### 2. List Available Tools
```bash
curl https://california-injury-mcp.YOUR-SUBDOMAIN.workers.dev/tools
```

### 3. Test MCP Protocol
```bash
curl -X POST https://california-injury-mcp.YOUR-SUBDOMAIN.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

### 4. Call a Tool
```bash
curl -X POST https://california-injury-mcp.YOUR-SUBDOMAIN.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "analyzeCase",
      "arguments": {
        "caseDescription": "I was rear-ended at a stoplight and suffered whiplash and a herniated disc. I had to get epidural injections and missed 3 weeks of work."
      }
    },
    "id": 2
  }'
```

## Integration with AI Models

### Claude Desktop App

1. Edit your Claude desktop configuration:
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the MCP server:
```json
{
  "mcpServers": {
    "california-injury-calculator": {
      "url": "https://california-injury-mcp.YOUR-SUBDOMAIN.workers.dev/mcp",
      "description": "California auto injury settlement calculator"
    }
  }
}
```

### Using with AI APIs

When using AI APIs that support MCP, you can configure them to use your MCP server endpoint. The AI will then be able to:

1. Calculate settlements based on detailed injury information
2. Estimate medical costs
3. Analyze injury cases described in natural language

### Example AI Prompts

Once connected, you can ask the AI:

- "Calculate a settlement for a 35-year-old office worker who suffered a herniated disc, had 2 epidural injections, and missed 30 days of work"
- "Estimate the medical costs for someone who had 3 ER visits, 20 physical therapy sessions, and 2 MRIs"
- "Analyze this case: I was t-boned at an intersection, broke my arm, and now have permanent nerve damage"

## Local Development

To run the MCP server locally:

```bash
# Install dependencies
npm install

# Run the MCP server locally
npx wrangler dev functions/mcp-server.ts --port 8788
```

The local MCP server will be available at `http://localhost:8788`

## Security Considerations

1. **CORS**: The server allows all origins (`*`). In production, configure this to only allow your specific domains.
2. **Rate Limiting**: Configure rate limiting in Cloudflare dashboard to prevent abuse.
3. **Input Validation**: All inputs are validated according to the schema.
4. **No PII Storage**: The MCP server doesn't store any personal information.

## Monitoring

View logs and analytics:
```bash
wrangler tail --name california-injury-mcp
```

## Troubleshooting

### Tool not found
- Ensure the tool name matches exactly: `calculateSettlement`, `estimateMedicalCosts`, or `analyzeCase`

### Invalid parameters
- Check that all required fields are provided
- Ensure numeric values are numbers, not strings

### CORS errors
- The server includes CORS headers for all origins
- If still having issues, check browser console for specific errors

## Advanced Usage

### Custom Tool Development

To add new tools, edit `functions/mcp/injury-calculator-mcp.ts`:

1. Add tool definition to `TOOLS` object
2. Add handler method
3. Update the switch statement in `handleToolCall`

### Batch Processing

You can create a tool that processes multiple cases at once for comparative analysis.

### Integration with Other Services

The MCP server can be extended to integrate with:
- Legal databases
- Medical cost databases
- Insurance APIs
- Court filing systems

## Support

For issues or questions:
1. Check the Cloudflare Workers logs
2. Review the error messages in API responses
3. Open an issue on the GitHub repository