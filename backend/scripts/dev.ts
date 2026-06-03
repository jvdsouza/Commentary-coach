import { execSync, spawnSync } from "child_process";
import path from "path";

const root = path.join(import.meta.dirname, "../..");
const composeFile = "backend/docker-compose.dev.yml";

const run = (cmd: string, args: string[]) =>
  spawnSync(cmd, args, { cwd: root, stdio: "inherit" });

console.log("[dev] pnpm install...");
execSync("pnpm install", { cwd: root, stdio: "inherit" });

const lockfileChanged =
  spawnSync("git", ["diff", "--quiet", "pnpm-lock.yaml"], { cwd: root }).status !== 0;

if (lockfileChanged) {
  console.log("[dev] pnpm-lock.yaml changed — cycling containers to refresh node_modules volumes...");
  // 'down' removes containers + anonymous volumes (node_modules) but NOT named volumes (postgres_data)
  run("docker", ["compose", "-f", composeFile, "down"]);
}

run("docker", ["compose", "-f", composeFile, "up", "--build", "--remove-orphans"]);
