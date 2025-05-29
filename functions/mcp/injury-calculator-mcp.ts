import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Import our calculator types and functions
import type { InjuryCalculatorData, SettlementResult } from '../api/calculate';

// Define our MCP tools
const TOOLS = {
  calculateSettlement: {
    name: 'calculateSettlement',
    description: 'Calculate a potential settlement for a California auto injury case',
    inputSchema: {
      type: 'object',
      properties: {
        demographics: {
          type: 'object',
          properties: {
            age: { type: 'number', description: 'Age of the injured person' },
            occupation: { type: 'string', description: 'Occupation of the injured person' },
            annualIncome: { type: 'number', description: 'Annual income before taxes' }
          },
          required: ['age', 'occupation', 'annualIncome']
        },
        accidentDetails: {
          type: 'object',
          properties: {
            dateOfAccident: { type: 'string', format: 'date' },
            faultPercentage: { type: 'number', minimum: 0, maximum: 100 },
            priorAccidents: { type: 'number', minimum: 0 },
            impactSeverity: { 
              type: 'string', 
              enum: ['low', 'moderate', 'severe', 'catastrophic'] 
            }
          },
          required: ['dateOfAccident', 'faultPercentage', 'impactSeverity']
        },
        injuries: {
          type: 'object',
          properties: {
            primaryInjury: { type: 'string' },
            secondaryInjuries: { type: 'array', items: { type: 'string' } },
            preExistingConditions: { type: 'array', items: { type: 'string' } },
            fractures: { type: 'array', items: { type: 'string' } },
            tbi: { type: 'boolean' },
            tbiSeverity: { 
              type: 'string', 
              enum: ['mild', 'moderate', 'severe'] 
            },
            spinalIssues: {
              type: 'object',
              properties: {
                herniation: { type: 'boolean' },
                nerveRootCompression: { type: 'boolean' },
                radiculopathy: { type: 'boolean' },
                myelopathy: { type: 'boolean' },
                preExistingDegeneration: { type: 'boolean' }
              }
            }
          },
          required: ['primaryInjury']
        },
        treatment: {
          type: 'object',
          properties: {
            emergencyRoomVisits: { type: 'number', minimum: 0 },
            urgentCareVisits: { type: 'number', minimum: 0 },
            chiropracticSessions: { type: 'number', minimum: 0 },
            physicalTherapySessions: { type: 'number', minimum: 0 },
            xrays: { type: 'number', minimum: 0 },
            mris: { type: 'number', minimum: 0 },
            ctScans: { type: 'number', minimum: 0 },
            painManagementVisits: { type: 'number', minimum: 0 },
            orthopedicConsults: { type: 'number', minimum: 0 },
            tpiInjections: { type: 'number', minimum: 0 },
            facetInjections: { type: 'number', minimum: 0 },
            mbbInjections: { type: 'number', minimum: 0 },
            esiInjections: { type: 'number', minimum: 0 },
            rfaInjections: { type: 'number', minimum: 0 },
            prpInjections: { type: 'number', minimum: 0 },
            surgeryRecommended: { type: 'boolean' },
            surgeryCompleted: { type: 'boolean' },
            surgeryType: { 
              type: 'string', 
              enum: ['minor', 'moderate', 'major'] 
            },
            totalMedicalCosts: { type: 'number', minimum: 0 },
            useEstimatedCosts: { type: 'boolean' },
            ongoingTreatment: { type: 'boolean' }
          }
        },
        impact: {
          type: 'object',
          properties: {
            missedWorkDays: { type: 'number', minimum: 0 },
            lossOfConsortium: { type: 'boolean' },
            emotionalDistress: { type: 'boolean' },
            dylanVLeggClaim: { type: 'boolean' },
            permanentImpairment: { type: 'boolean' },
            impairmentRating: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        insurance: {
          type: 'object',
          properties: {
            policyLimitsKnown: { type: 'boolean' },
            policyLimits: { type: 'number', minimum: 0 },
            hasAttorney: { type: 'boolean' },
            attorneyContingency: { type: 'number', minimum: 0, maximum: 50 }
          }
        }
      },
      required: ['demographics', 'accidentDetails', 'injuries', 'treatment', 'impact', 'insurance']
    }
  },
  estimateMedicalCosts: {
    name: 'estimateMedicalCosts',
    description: 'Estimate medical costs based on treatment received',
    inputSchema: {
      type: 'object',
      properties: {
        treatment: {
          type: 'object',
          properties: {
            emergencyRoomVisits: { type: 'number', minimum: 0 },
            urgentCareVisits: { type: 'number', minimum: 0 },
            chiropracticSessions: { type: 'number', minimum: 0 },
            physicalTherapySessions: { type: 'number', minimum: 0 },
            xrays: { type: 'number', minimum: 0 },
            mris: { type: 'number', minimum: 0 },
            ctScans: { type: 'number', minimum: 0 },
            painManagementVisits: { type: 'number', minimum: 0 },
            orthopedicConsults: { type: 'number', minimum: 0 },
            tpiInjections: { type: 'number', minimum: 0 },
            facetInjections: { type: 'number', minimum: 0 },
            mbbInjections: { type: 'number', minimum: 0 },
            esiInjections: { type: 'number', minimum: 0 },
            rfaInjections: { type: 'number', minimum: 0 },
            prpInjections: { type: 'number', minimum: 0 },
            surgeryRecommended: { type: 'boolean' },
            surgeryType: { 
              type: 'string', 
              enum: ['minor', 'moderate', 'major'] 
            }
          }
        }
      },
      required: ['treatment']
    }
  },
  analyzeCase: {
    name: 'analyzeCase',
    description: 'Analyze an injury case and provide insights about settlement factors',
    inputSchema: {
      type: 'object',
      properties: {
        caseDescription: { 
          type: 'string', 
          description: 'Natural language description of the injury case' 
        }
      },
      required: ['caseDescription']
    }
  }
};

// Create the MCP server
class InjuryCalculatorMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'california-injury-calculator',
        vendor: 'injury-calculator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Object.values(TOOLS),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'calculateSettlement':
          return this.handleCalculateSettlement(args);
        
        case 'estimateMedicalCosts':
          return this.handleEstimateMedicalCosts(args);
        
        case 'analyzeCase':
          return this.handleAnalyzeCase(args);
        
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    });
  }

  private async handleCalculateSettlement(args: any) {
    try {
      // Import the calculation function dynamically
      const { calculateSettlement } = await import('../api/calculate');
      
      const data: InjuryCalculatorData = args;
      const result = calculateSettlement(data);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error calculating settlement: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }

  private async handleEstimateMedicalCosts(args: any) {
    try {
      // Import the estimation function dynamically
      const { estimateMedicalCosts } = await import('../api/calculate');
      
      const costs = estimateMedicalCosts(args.treatment);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              estimatedMedicalCosts: costs,
              formatted: `$${costs.toLocaleString()}`
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error estimating medical costs: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }

  private async handleAnalyzeCase(args: any) {
    const { caseDescription } = args;
    
    // This is a simple analysis - in production, you might use AI or more sophisticated parsing
    const analysis = {
      keyFactors: [],
      estimatedSeverity: 'unknown',
      recommendations: []
    };
    
    // Look for keywords to provide basic analysis
    const lowerCase = caseDescription.toLowerCase();
    
    if (lowerCase.includes('surgery')) {
      analysis.keyFactors.push('Surgery mentioned - significant factor');
      analysis.estimatedSeverity = 'severe';
    }
    
    if (lowerCase.includes('fracture') || lowerCase.includes('broken')) {
      analysis.keyFactors.push('Fractures present - increases value');
    }
    
    if (lowerCase.includes('permanent') || lowerCase.includes('disability')) {
      analysis.keyFactors.push('Permanent injury - major impact on settlement');
      analysis.estimatedSeverity = 'catastrophic';
    }
    
    if (lowerCase.includes('whiplash') || lowerCase.includes('soft tissue')) {
      analysis.keyFactors.push('Soft tissue injury - typically lower settlements');
      analysis.estimatedSeverity = analysis.estimatedSeverity === 'unknown' ? 'minor' : analysis.estimatedSeverity;
    }
    
    // Add recommendations
    if (analysis.keyFactors.length > 0) {
      analysis.recommendations.push('Document all medical treatment thoroughly');
      analysis.recommendations.push('Keep records of missed work and daily impact');
      
      if (analysis.estimatedSeverity === 'severe' || analysis.estimatedSeverity === 'catastrophic') {
        analysis.recommendations.push('Consider consulting with an attorney');
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('California Injury Calculator MCP server running');
  }
}

// Export for use in Cloudflare Workers
export { InjuryCalculatorMCPServer };

// If running directly (not in Workers), start the server
if (typeof process !== 'undefined' && process.argv[1] === new URL(import.meta.url).pathname) {
  const server = new InjuryCalculatorMCPServer();
  server.run().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}