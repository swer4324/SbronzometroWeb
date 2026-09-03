import { cp, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(currentDir, "..");
const distDir = resolve(webRoot, "dist");
const docsDir = resolve(webRoot, "docs");

await mkdir(docsDir, { recursive: true });
// Keep deployment-only files such as _headers and legal PDFs that are not part
// of Vite's dist directory while refreshing every generated asset.
await cp(distDir, docsDir, { recursive: true, force: true });
await writeFile(resolve(docsDir, ".nojekyll"), "");

console.log(`Copied ${distDir} -> ${docsDir}`);
