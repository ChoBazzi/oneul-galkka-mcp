#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createOneulGalkkaServer } from "./mcpServer.js";

async function main() {
  const server = createOneulGalkkaServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start oneul-galkka-mcp:", error);
  process.exit(1);
});
