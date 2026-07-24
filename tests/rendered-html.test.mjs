import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("production artifact contains client and worker output", () => {
  assert.equal(existsSync("dist/server/index.js"), true);
  assert.equal(existsSync("dist/client/assets"), true);
});

test("static market snapshot contains only real or explicitly unavailable data", () => {
  const snapshot = JSON.parse(readFileSync("app/data/commodities.json", "utf8"));
  assert.equal(snapshot.commodities.length, 17);
  for (const commodity of snapshot.commodities) {
    if (commodity.status === "ok") {
      assert.ok(commodity.source);
      assert.ok(commodity.seriesId);
      assert.ok(commodity.series.length > 1);
      assert.equal(commodity.price, commodity.series.at(-1).value);
      assert.equal(new Set(commodity.series.map(point => point.date)).size, commodity.series.length);
    } else {
      assert.equal(commodity.status, "unavailable");
      assert.equal(commodity.price, null);
      assert.deepEqual(commodity.series, []);
    }
  }
});

test("browser source contains no market API credentials or network calls", () => {
  const browserFiles = [
    "app/lib/market.ts",
    "app/ui/Dashboard.tsx",
    "app/ui/CommodityCard.tsx",
    "app/ui/CommodityPage.tsx",
  ].map(file => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(browserFiles, /TRADING_ECONOMICS_API_KEY|api\.tradingeconomics\.com|fetch\s*\(/);
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
