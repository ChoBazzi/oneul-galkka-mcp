import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { Request, Response } from "express";
import { createOneulGalkkaServer } from "./mcpServer.js";

export interface HttpAppOptions {
  endpointPath?: string;
  host?: string;
  allowedHosts?: string[];
}

export function createHttpApp(options: HttpAppOptions = {}) {
  const endpointPath = options.endpointPath ?? "/mcp";
  const app = createMcpExpressApp({
    host: options.host ?? "127.0.0.1",
    allowedHosts: options.allowedHosts
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      ok: true,
      service: "oneul-galkka-mcp"
    });
  });

  app.post(endpointPath, async (req: Request, res: Response) => {
    const server = createOneulGalkkaServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    res.on("close", () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP HTTP request failed:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error"
          },
          id: null
        });
      }
    }
  });

  app.get(endpointPath, (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed. Use POST for stateless Streamable HTTP."
      },
      id: null
    });
  });

  app.delete(endpointPath, (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    });
  });

  return app;
}
