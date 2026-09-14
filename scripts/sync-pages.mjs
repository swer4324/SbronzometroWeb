import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(currentDir, "..");
const distDir = resolve(webRoot, "dist");
const docsDir = resolve(webRoot, "docs");

if (dirname(docsDir) !== webRoot || basename(docsDir) !== "docs") {
  throw new Error(`Refusing to clean unexpected deployment directory: ${docsDir}`);
}

// docs is generated output. Recreate it so hashed assets from older releases
// cannot be published beside the current application bundle.
await rm(docsDir, { recursive: true, force: true });
await mkdir(docsDir, { recursive: true });
await cp(distDir, docsDir, { recursive: true, force: true });
await writeFile(resolve(docsDir, ".nojekyll"), "");

console.log(`Copied ${distDir} -> ${docsDir}`);
