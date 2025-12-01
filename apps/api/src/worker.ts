import { Hono } from "hono";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

  console.log(c.env.CLOUDFLARE_ACCOUNT_ID, "😂😂😂");
  // Create S3 client configured for R2
  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${c.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    },
  });

  // Generate presigned URL for direct R2 upload
  const command = new PutObjectCommand({
    Bucket: c.env.BUCKET_NAME,
    Key: key,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // URL expires in 1 hour
  });

  return c.json({
    uploadUrl,
    key,
    expiresIn: 3600,
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
    ctx: ExecutionContext
  ): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
};
