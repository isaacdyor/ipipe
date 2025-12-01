import { Hono } from "hono";
import type { worker } from "../alchemy.run.ts";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello World from my-alchemy-app!");
});

export default {
  async fetch(
    request: Request,
    env: typeof worker.Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
};
