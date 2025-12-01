import { Hono } from "hono";
import type { worker } from "../alchemy.run.ts";

type Bindings = typeof worker.Env;

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello World from my-alchemy-app!");
});

// Get presigned URL for upload
app.post("/upload-url", async (c) => {
  const { filename } = await c.req.json();

  if (!filename) {
    return c.json({ error: "filename is required" }, 400);
  }

  const key = `${Date.now()}-${filename}`;

  // Since R2 doesn't support presigned URLs in the traditional sense,
  // we'll return the key and let clients upload via our API endpoint
  // Or use the R2 public bucket URL if devDomain is enabled
  return c.json({
    key: key,
    uploadEndpoint: `/upload/${key}`,
    message: "Use the upload endpoint to upload your file",
  });
});

// Upload file endpoint
app.put("/upload/:key", async (c) => {
  const key = c.req.param("key");
  const body = await c.req.arrayBuffer();

  await c.env.BUCKET.put(key, body);

  return c.json({
    success: true,
    key: key,
    message: "File uploaded successfully",
  });
});

// List all files in bucket
app.get("/files", async (c) => {
  const listed = await c.env.BUCKET.list();

  const files = listed.objects.map((obj) => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded,
  }));

  return c.json({ files });
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
