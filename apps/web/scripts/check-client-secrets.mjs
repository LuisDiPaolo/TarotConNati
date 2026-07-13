import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const forbidden = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL",
  "MP_ACCESS_TOKEN",
  "RESEND_API_KEY",
  "VAPID_PRIVATE_KEY",
];

const roots = ["src/app", "src/components", "src/lib"];
const clientMarkers = ['"use client"', "'use client'"];
let failed = false;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    if (!stat.isFile() || !/\.(ts|tsx)$/.test(path)) continue;
    const content = readFileSync(path, "utf8");
    if (!clientMarkers.some((marker) => content.includes(marker))) continue;
    for (const secret of forbidden) {
      if (content.includes(secret)) {
        console.error(`Server-only env var ${secret} referenced in client file ${path}`);
        failed = true;
      }
    }
  }
}

for (const root of roots) walk(root);
if (failed) process.exit(1);
