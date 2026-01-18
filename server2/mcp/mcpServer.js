import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import documentParser from "../tools/documentParser.js";
import dataConverter from "../tools/dataConverter.js";
import schemaValidatorTool from "../tools/schemaValidatorTool.js";
import documentClassifier from "../tools/documentClassfier.js";
import rulesEngine from "../tools/rulesEngine.js";
import riskCalculator from "../tools/riskCalculator.js";
import qualityChecker from "../tools/qualityChecker.js";

class MCPServerManager {
  constructor() {
    this.mcp = new McpServer({
      name: "claim-processing-mcp",
      version: "1.0.0",
    });
    this.setupTools();
  }

  setupTools() {
    // Register Document Parser Tool
    this.mcp.registerTool("documentParser", {
      description: "Parses claim form documents and extracts structured data",
      inputSchema: {
        type: "object",
        properties: {
          document: {
            type: "string",
            description: "The document content to parse"
          },
          documentType: {
            type: "string",
            description: "Type of document (e.g., claim_form, attachment)"
          }
        },
        required: ["document"]
      }
    }, documentParser);

    // Register Data Converter Tool
    this.mcp.registerTool("dataConverter", {
      description: "Converts unstructured data to structured JSON format",
      inputSchema: {
        type: "object",
        properties: {
          data: {
            type: "object",
            description: "The unstructured data to convert"
          },
          targetSchema: {
            type: "string",
            description: "Target schema format (e.g., claim_intake_schema)"
          }
        },
        required: ["data", "targetSchema"]
      }
    }, dataConverter);

    // Register Schema Validator Tool
    this.mcp.registerTool("schemaValidator", {
      description: "Validates data against a specific schema",
      inputSchema: {
        type: "object",
        properties: {
          data: {
            type: "object",
            description: "The data to validate"
          },
          schema: {
            type: "string",
            description: "The schema to validate against"
          }
        },
        required: ["data", "schema"]
      }
    }, schemaValidatorTool);

    // Register Document Classifier Tool
    this.mcp.registerTool("documentClassifier", {
      description: "Classifies and categorizes claim form data",
      inputSchema: {
        type: "object",
        properties: {
          claimData: {
            type: "object",
            description: "The claim data to classify"
          },
          categories: {
            type: "array",
            description: "List of categories to classify into"
          }
        },
        required: ["claimData"]
      }
    }, documentClassifier);

    // Register Rules Engine Tool
    this.mcp.registerTool("rulesEngine", {
      description: "Executes business rules for fraud screening",
      inputSchema: {
        type: "object",
        properties: {
          claimData: {
            type: "object",
            description: "The claim data to check"
          },
          ruleSet: {
            type: "string",
            description: "The rule set to apply (e.g., basic_fraud_rules)"
          }
        },
        required: ["claimData", "ruleSet"]
      }
    }, rulesEngine);

    // Register Risk Calculator Tool
    this.mcp.registerTool("riskCalculator", {
      description: "Calculates risk score based on claim characteristics",
      inputSchema: {
        type: "object",
        properties: {
          claimData: {
            type: "object",
            description: "The claim data for risk assessment"
          },
          factors: {
            type: "array",
            description: "Risk factors to consider"
          }
        },
        required: ["claimData"]
      }
    }, riskCalculator);

    // Register Quality Checker Tool
    this.mcp.registerTool("qualityChecker", {
      description: "Validates the overall quality and completeness of claim data",
      inputSchema: {
        type: "object",
        properties: {
          claimData: {
            type: "object",
            description: "The claim data to validate"
          },
          qualityThresholds: {
            type: "object",
            description: "Quality thresholds for validation",
            properties: {
              minimum: {
                type: "number",
                description: "Minimum quality score threshold (0-100)"
              }
            }
          }
        },
        required: ["claimData"]
      }
    }, qualityChecker);
  }

  getRegisteredTools() {
    return this.mcp._registeredTools || {};
  }

  async callTool(toolName, parameters) {
    const tools = this.getRegisteredTools();
    if (!tools[toolName]) {
      throw new Error(`Tool ${toolName} not found`);
    }
    return await tools[toolName].handler(parameters);
  }

  getMCP() {
    return this.mcp;
  }
}

export default new MCPServerManager();
