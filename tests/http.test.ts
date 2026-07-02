import { describe, expect, it } from "vitest";
import { EventEmitter } from "node:events";
import httpMocks from "node-mocks-http";
import { createHttpApp } from "../src/httpApp.js";
import { createOneulGalkkaServer } from "../src/mcpServer.js";

function handleRequest(
  app: ReturnType<typeof createHttpApp>,
  options: Parameters<typeof httpMocks.createRequest>[0]
): Promise<ReturnType<typeof httpMocks.createResponse>> {
  const req = httpMocks.createRequest(options);
  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

  return new Promise((resolve) => {
    res.on("end", () => resolve(res));
    app.handle(req, res);
  });
}

describe("HTTP MCP endpoint", () => {
  it("creates an Express app with the expected route surface", () => {
    const app = createHttpApp();
    const routes = app.router.stack
      .filter((layer: { route?: { path: string; methods: Record<string, boolean> } }) => layer.route)
      .map((layer: { route: { path: string; methods: Record<string, boolean> } }) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods)
      }));

    expect(routes).toContainEqual({ path: "/health", methods: ["get"] });
    expect(routes).toContainEqual({ path: "/mcp", methods: ["post"] });
    expect(routes).toContainEqual({ path: "/mcp", methods: ["get"] });
    expect(routes).toContainEqual({ path: "/mcp", methods: ["delete"] });
  });

  it("creates the MCP server used by the HTTP endpoint", () => {
    const server = createOneulGalkkaServer();

    expect(server).toBeTruthy();
  });

  it("allows deployed host headers by default", async () => {
    const app = createHttpApp({ host: "0.0.0.0" });

    const response = await handleRequest(app, {
      method: "GET",
      url: "/health",
      headers: {
        host: "example.com"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response._getJSONData()).toEqual({
      ok: true,
      service: "oneul-galkka-mcp"
    });
  });
});
