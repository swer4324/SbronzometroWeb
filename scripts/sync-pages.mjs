import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(currentDir, "..");
const distDir = resolve(webRoot, "dist");
const docsDir = resolve(webRoot, "docs");

await rm(docsDir, { recursive: true, force: true });
await mkdir(docsDir, { recursive: true });
await cp(distDir, docsDir, { recursive: true });
await writeFile(resolve(docsDir, ".nojekyll"), "");

console.log(`Copied ${distDir} -> ${docsDir}`);
