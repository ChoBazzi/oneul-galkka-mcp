import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools/registerTools.js";

export function createOneulGalkkaServer() {
  const server = new McpServer({
    name: "oneul-galkka-mcp",
    version: "0.1.0"
  });

  registerTools(server);

  return server;
}
