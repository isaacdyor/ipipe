import alchemy from "alchemy";
import { Worker, R2Bucket } from "alchemy/cloudflare";

const app = await alchemy("api", {
  stage: "dev",
  password: process.env.ALCHEMY_PASSWORD,
});

const bucket = await R2Bucket("bucket", {
  name: "bucket",
  devDomain: true,
});

export const worker = await Worker("worker", {
  entrypoint: "src/worker.ts",
  bindings: {
    BUCKET: bucket,
    BUCKET_NAME: "bucket",
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || "",
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || "",
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || "",
  },
});

console.log(worker.Env, "❤️❤️❤️");

await app.finalize();
