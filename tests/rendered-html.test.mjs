import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("production artifact contains client and worker output", () => {
  assert.equal(existsSync("dist/server/index.js"), true);
  assert.equal(existsSync("dist/client/assets"), true);
  assert.equal(existsSync("dist/client/data/market.json"), true);
});

test("all commodity configs are valid and uniquely addressable", async () => {
  const { readdir } = await import("node:fs/promises");
  const names = (await readdir("config")).filter(name => name.endsWith(".json"));
  assert.equal(names.length, 17);
  const configs = names.map(name => JSON.parse(readFileSync(`config/${name}`, "utf8")));
  assert.equal(new Set(configs.map(item => item.slug)).size, 17);
  for (const item of configs) {
    assert.ok(item.displayName);
    assert.ok(item.unit);
    assert.ok(item.datasets.length);
  }
});

test("documentation and both automation workflows ship", () => {
  for (const file of ["README.md","ARCHITECTURE.md","DATA_SOURCES.md","ROADMAP.md","DISCLAIMER.md","LICENSE",".github/workflows/update-data.yml",".github/workflows/deploy-pages.yml"]) {
    assert.equal(existsSync(file), true, `${file} is missing`);
  }
});
