import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("public/data/market.json");
const temporary = `${output}.next`;
const fredSeries = {
  corn: "PMAIZMTUSDM",
  wheat: "PWHEAMTUSDM",
  soybeans: "PSOYBUSDM",
  "henry-hub": "DHHNGSP",
  brent: "DCOILBRENTEU",
};

async function fetchFred(id) {
  const response = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`);
  if (!response.ok) throw new Error(`FRED ${id}: HTTP ${response.status}`);
  const lines = (await response.text()).trim().split("\n").slice(1);
  return lines.map(line => {
    const [date, raw] = line.split(",");
    return { date, value: Number(raw) };
  }).filter(point => Number.isFinite(point.value));
}

async function main() {
  const previous = JSON.parse(await readFile(output, "utf8"));
  const datasets = { ...(previous.datasets ?? {}) };
  const failures = [];
  let successes = 0;
  for (const [slug, id] of Object.entries(fredSeries)) {
    try {
      const series = await fetchFred(id);
      if (series.length < 2) throw new Error("insufficient observations");
      datasets[slug] = { source: "FRED", sourceUrl: `https://fred.stlouisfed.org/series/${id}`, updatedAt: new Date().toISOString(), series };
      successes++;
    } catch (error) {
      failures.push({ slug, message: error instanceof Error ? error.message : String(error) });
    }
  }
  if (successes === 0) throw new Error("All sources failed; preserving previous successful dataset.");
  const next = { updatedAt: new Date().toISOString(), status: failures.length ? "partial" : "complete", failures, datasets };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`);
  await rename(temporary, output);
  console.log(`Updated ${successes} datasets; preserved prior data for ${failures.length} failures.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
