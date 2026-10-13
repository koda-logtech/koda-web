/**
 * Sobe koda-server + Vite para E2E. Não imprime variáveis de ambiente.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const serverDir = process.env.KODA_SERVER_DIR
  ? path.resolve(process.env.KODA_SERVER_DIR)
  : path.resolve(webRoot, "..", "koda-server");

const API_HEALTH_URL = process.env.E2E_API_HEALTH_URL ?? "http://localhost:3000/health";
const WEB_URL = process.env.E2E_WEB_URL ?? "http://localhost:5173";

function die(message) {
  console.error(`[e2e-stack] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(serverDir)) {
  die(
    `Pasta do server não encontrada: ${serverDir}. Defina KODA_SERVER_DIR (ex.: ../koda-server).`,
  );
}

const children = [];

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 300).unref();
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));

async function waitForUrl(url, label, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.ok || res.status < 500) return;
    } catch {
      // API ainda não disponível
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  die(`${label} não ficou pronto a tempo: ${url}`);
}

function spawnLogged(name, command, args, options) {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  children.push(child);
  const prefix = `[${name}]`;
  child.stdout?.on("data", (chunk) => {
    for (const line of chunk.toString().split("\n")) {
      if (line.trim()) console.log(`${prefix} ${line}`);
    }
  });
  child.stderr?.on("data", (chunk) => {
    for (const line of chunk.toString().split("\n")) {
      if (line.trim()) console.error(`${prefix} ${line}`);
    }
  });
  child.on("exit", (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`${prefix} encerrou com código ${code}${signal ? ` (${signal})` : ""}`);
      shutdown(code ?? 1);
    }
  });
  return child;
}

const viteEnv = {
  ...process.env,
  VITE_API_URL: process.env.VITE_API_URL ?? "http://localhost:3000",
};

console.log("[e2e-stack] Iniciando API…");
spawnLogged("api", "npm", ["run", "dev"], { cwd: serverDir, env: process.env });

await waitForUrl(API_HEALTH_URL, "API");

console.log("[e2e-stack] Iniciando Vite…");
spawnLogged("web", "npm", ["run", "dev", "--", "--host", "localhost", "--port", "5173"], {
  cwd: webRoot,
  env: viteEnv,
});

await waitForUrl(WEB_URL, "Vite");

console.log("[e2e-stack] Stack pronta (API + web).");
