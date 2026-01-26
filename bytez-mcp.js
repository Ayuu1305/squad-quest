// D:/Squad Quest/bytez-mcp.js
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Bytez from "bytez.js";

// Use the key you have (starting with 4bb42...)
const apiKey = process.env.BYTEZ_API_KEY;
if (!apiKey) {
  console.error("Error: BYTEZ_API_KEY is missing!");
  process.exit(1);
}

const bytez = new Bytez(apiKey);

const server = new Server(
  { name: "bytez-bridge", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

// 1. Tell Antigravity what tools are available
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_ai_model",
        description:
          "Run any AI model from Bytez (e.g., for generating quests, images, or chat).",
        inputSchema: {
          type: "object",
          properties: {
            modelId: {
              type: "string",
              description:
                "The model ID (e.g. 'Qwen/Qwen2-7B-Instruct' for text, 'black-forest-labs/FLUX.1-schnell' for images)",
            },
            prompt: {
              type: "string",
              description: "The instruction for the model",
            },
          },
          required: ["modelId", "prompt"],
        },
      },
    ],
  };
});

// 2. Execute the tool when Antigravity asks
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "run_ai_model") {
    const { modelId, prompt } = request.params.arguments;
    try {
      const model = bytez.model(modelId);
      const output = await model.run(prompt);
      return {
        content: [
          { type: "text", text: JSON.stringify(output.output || output) },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }
  throw new Error("Tool not found");
});

// 3. Connect via Standard Input/Output
const transport = new StdioServerTransport();
await server.connect(transport);
