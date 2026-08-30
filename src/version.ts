import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

// In the Docker image these files are baked in at build time from the repo's
// .git (see the `gitinfo` Dockerfile stage), since the runtime image itself
// doesn't ship .git. In local dev (`bun run dev`/`start`, no such file) we
// fall back to asking git directly — .git is present in the checkout.
const APP_ROOT = join(import.meta.dir, "..");

function readBaked(file: string): string | undefined {
  const path = join(APP_ROOT, file);
  if (!existsSync(path)) return undefined;
  const value = readFileSync(path, "utf8").trim();
  return value || undefined;
}

function tryGit(cmd: string): string | undefined {
  try {
    return (
      execSync(cmd, {
        cwd: APP_ROOT,
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString()
        .trim() || undefined
    );
  } catch {
    return undefined;
  }
}

export const gitCommit: string =
  readBaked("GIT_COMMIT") ?? tryGit("git rev-parse --short HEAD") ?? "unknown";

export const gitBranch: string =
  readBaked("GIT_BRANCH") ??
  tryGit("git rev-parse --abbrev-ref HEAD") ??
  "unknown";
