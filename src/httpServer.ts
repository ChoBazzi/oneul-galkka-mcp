#!/usr/bin/env node
import { createHttpApp } from "./httpApp.js";

const port = Number(process.env.PORT ?? 3000);
const endpointPath = process.env.MCP_ENDPOINT_PATH ?? "/mcp";
const host = process.env.MCP_HOST ?? "0.0.0.0";
const configuredAllowedHosts = process.env.MCP_ALLOWED_HOSTS?.split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const app = createHttpApp({
  endpointPath,
  host,
  allowedHosts: configuredAllowedHosts?.length ? configuredAllowedHosts : undefined
});

app.listen(port, host, () => {
  console.error(`oneul-galkka-mcp HTTP server listening on ${host}:${port}${endpointPath}`);
});
