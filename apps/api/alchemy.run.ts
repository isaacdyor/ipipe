import alchemy from "alchemy";
import { Worker, R2Bucket } from "alchemy/cloudflare";

const app = await alchemy("api");

const bucket = await R2Bucket("bucket", {
  name: "bucket",
  devDomain: true,
});

export const worker = await Worker("worker", {
  entrypoint: "src/worker.ts",
  bindings: {
    BUCKET: bucket,
  },
});

console.log(worker.url);

await app.finalize();
