import { writeFile } from "fs/promises";
import path from "path";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set");
  process.exit(1);
}

const res = await fetch("https://api.openai.com/v1/models", {
  headers: { Authorization: `Bearer ${apiKey}` },
});

if (!res.ok) {
  console.error(`Failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}

const { data } = await res.json() as { data: Array<{ id: string; created: number; owned_by: string }> };

const models = data
  .sort((a, b) => a.id.localeCompare(b.id))
  .map(({ id, owned_by }) => ({ id, owned_by }));

const outPath = path.join(import.meta.dirname, "../available-models.json");
await writeFile(outPath, JSON.stringify(models, null, 2) + "\n");
console.log(`Wrote ${models.length} models to available-models.json`);
