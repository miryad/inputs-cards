import { copyFile, readFile, stat } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve("dist");
const indexPath = path.join(outputDirectory, "index.html");
const html = await readFile(indexPath, "utf8");

if (!html.includes("/inputs-cards/assets/")) {
  throw new Error("The Pages build does not use the /inputs-cards/ base path.");
}

const assetUrls = [...html.matchAll(/(?:src|href)="(\/inputs-cards\/[^"]+)"/g)]
  .map((match) => match[1])
  .filter((url) => url.startsWith("/inputs-cards/assets/"));

if (assetUrls.length === 0) {
  throw new Error("The Pages build did not emit any asset references.");
}

for (const url of assetUrls) {
  const relativePath = url.slice("/inputs-cards/".length);
  await stat(path.join(outputDirectory, relativePath));
}

// GitHub Pages has no rewrite rules. Serving the SPA shell as 404.html keeps
// direct commodity URLs functional while React Router restores the route.
await copyFile(indexPath, path.join(outputDirectory, "404.html"));

console.log(`Verified dist/index.html and ${assetUrls.length} base-prefixed assets.`);
