import { InjuryCalculatorMCPServer } from './mcp/injury-calculator-mcp';

export interface Env {
  // Environment variables if needed
}

// ExecutionContext type for Cloudflare Workers
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

// MCP over HTTP for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Add CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle OPTIONS for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }
    
    // MCP endpoint information
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(JSON.stringify({
        name: 'California Injury Calculator MCP Server',
        version: '1.0.0',
        description: 'MCP server for calculating auto injury settlements in California',
        endpoints: {
          '/mcp': 'POST - Send MCP protocol messages',
          '/tools': 'GET - List available tools',
          '/health': 'GET - Health check'
        }
      }, null, 2), { headers });
    }
    
    // List available tools
    if (url.pathname === '/tools' && request.method === 'GET') {
      return new Response(JSON.stringify({
        tools: [
          {
            name: 'calculateSettlement',
            description: 'Calculate a potential settlement for a California auto injury case',
            parameters: 'Full InjuryCalculatorData object with demographics, accident details, injuries, treatment, impact, and insurance information'
          },
          {
            name: 'estimateMedicalCosts',
            description: 'Estimate medical costs based on treatment received',
            parameters: 'Treatment object with visit counts and procedure details'
          },
          {
            name: 'analyzeCase',
            description: 'Analyze an injury case and provide insights about settlement factors',
            parameters: 'caseDescription string with natural language description'
          }
        ]
      }, null, 2), { headers });
    }
    
    // Health check
    if (url.pathname === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), { headers });
    }
    
    // Handle MCP protocol messages
    if (url.pathname === '/mcp' && request.method === 'POST') {
      try {
        const body = await request.json();
        
        // Validate MCP request structure
        if (!body.jsonrpc || body.jsonrpc !== '2.0') {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32600,
              message: 'Invalid Request',
              data: 'Missing or invalid jsonrpc version'
            },
            id: body.id || null
          }), { status: 400, headers });
        }
        
        // Route based on method
        switch (body.method) {
          case 'tools/list':
            return handleToolsList(body, headers);
          
          case 'tools/call':
            return handleToolCall(body, headers);
          
          default:
            return new Response(JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: -32601,
                message: 'Method not found',
                data: `Unknown method: ${body.method}`
              },
              id: body.id || null
            }), { status: 404, headers });
        }
      } catch (error) {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error',
            data: error instanceof Error ? error.message : 'Invalid JSON'
          },
          id: null
        }), { status: 400, headers });
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

async function handleToolsList(request: any, headers: HeadersInit): Promise<Response> {
  return new Response(JSON.stringify({
    jsonrpc: '2.0',
    result: {
      tools: [
        {
          name: 'calculateSettlement',
          description: 'Calculate a potential settlement for a California auto injury case',
          inputSchema: {
            type: 'object',
            properties: {
              demographics: { type: 'object' },
              accidentDetails: { type: 'object' },
              injuries: { type: 'object' },
              treatment: { type: 'object' },
              impact: { type: 'object' },
              insurance: { type: 'object' }
            },
            required: ['demographics', 'accidentDetails', 'injuries', 'treatment', 'impact', 'insurance']
          }
        },
        {
          name: 'estimateMedicalCosts',
          description: 'Estimate medical costs based on treatment received',
          inputSchema: {
            type: 'object',
            properties: {
              treatment: { type: 'object' }
            },
            required: ['treatment']
          }
        },
        {
          name: 'analyzeCase',
          description: 'Analyze an injury case and provide insights',
          inputSchema: {
            type: 'object',
            properties: {
              caseDescription: { type: 'string' }
            },
            required: ['caseDescription']
          }
        }
      ]
    },
    id: request.id
  }), { headers });
}

async function handleToolCall(request: any, headers: HeadersInit): Promise<Response> {
  const { name, arguments: args } = request.params || {};
  
  try {
    let result: any;
    
    switch (name) {
      case 'calculateSettlement': {
        const { calculateSettlement } = await import('./api/calculate');
        result = calculateSettlement(args);
        break;
      }
      
      case 'estimateMedicalCosts': {
        const { estimateMedicalCosts } = await import('./api/calculate');
        result = { 
          estimatedCosts: estimateMedicalCosts(args.treatment),
          formatted: `$${estimateMedicalCosts(args.treatment).toLocaleString()}`
        };
        break;
      }
      
      case 'analyzeCase': {
        result = analyzeInjuryCase(args.caseDescription);
        break;
      }
      
      default:
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32602,
            message: 'Invalid params',
            data: `Unknown tool: ${name}`
          },
          id: request.id
        }), { status: 400, headers });
    }
    
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      },
      id: request.id
    }), { headers });
    
  } catch (error) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : 'Unknown error'
      },
      id: request.id
    }), { status: 500, headers });
  }
}

function analyzeInjuryCase(description: string) {
  const analysis = {
    keyFactors: [] as string[],
    estimatedSeverity: 'unknown',
    recommendations: [] as string[],
    potentialRange: null as { low: number, high: number } | null
  };
  
  const lowerCase = description.toLowerCase();
  
  // Analyze severity indicators
  if (lowerCase.includes('surgery') || lowerCase.includes('operation')) {
    analysis.keyFactors.push('Surgery required - significant case value increase');
    analysis.estimatedSeverity = 'severe';
    analysis.potentialRange = { low: 75000, high: 250000 };
  }
  
  if (lowerCase.includes('fracture') || lowerCase.includes('broken')) {
    analysis.keyFactors.push('Fractures present - substantial injury');
    if (analysis.estimatedSeverity === 'unknown') {
      analysis.estimatedSeverity = 'moderate';
      analysis.potentialRange = { low: 30000, high: 150000 };
    }
  }
  
  if (lowerCase.includes('permanent') || lowerCase.includes('disability')) {
    analysis.keyFactors.push('Permanent injury - major settlement factor');
    analysis.estimatedSeverity = 'catastrophic';
    analysis.potentialRange = { low: 150000, high: 500000 };
  }
  
  if (lowerCase.includes('whiplash') || lowerCase.includes('soft tissue')) {
    analysis.keyFactors.push('Soft tissue injury - typically lower settlements');
    if (analysis.estimatedSeverity === 'unknown') {
      analysis.estimatedSeverity = 'minor';
      analysis.potentialRange = { low: 5000, high: 25000 };
    }
  }
  
  if (lowerCase.includes('brain') || lowerCase.includes('tbi')) {
    analysis.keyFactors.push('Traumatic brain injury - very serious');
    analysis.estimatedSeverity = 'catastrophic';
    analysis.potentialRange = { low: 100000, high: 1000000 };
  }
  
  // Add specific recommendations
  analysis.recommendations.push('Document all medical treatment and expenses');
  analysis.recommendations.push('Keep detailed records of pain and daily limitations');
  analysis.recommendations.push('Photograph visible injuries regularly');
  
  if (analysis.estimatedSeverity === 'severe' || analysis.estimatedSeverity === 'catastrophic') {
    analysis.recommendations.push('Strongly consider hiring an experienced personal injury attorney');
    analysis.recommendations.push('Do not accept the first settlement offer');
  }
  
  if (lowerCase.includes('work') || lowerCase.includes('job')) {
    analysis.recommendations.push('Document all missed work and lost wages');
    analysis.recommendations.push('Get a letter from employer about work restrictions');
  }
  
  return analysis;
}