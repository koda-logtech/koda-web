/**
 * Sobe koda-server + Vite para E2E. Não imprime variáveis de ambiente.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const serverDir = process.env.KODA_SERVER_DIR
  ? path.resolve(process.env.KODA_SERVER_DIR)
  : path.resolve(webRoot, "..", "koda-server");

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

const npmExec = process.platform === "win32" ? "npm.cmd" : "npm";

const children = [];

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 300).unref();
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));

async function isUp(url) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

function healthUrl(base) {
  return `${base.replace(/\/$/, "").replace(/\/api$/, "")}/health`;
}

/** Só aceita o koda-server (`{ status: "UP" }`). Um 200 genérico na porta não conta. */
async function isKodaApi(base) {
  try {
    const res = await fetch(healthUrl(base), { redirect: "manual" });
    if (!res.ok) return false;
    const body = await res.json();
    return body?.status === "UP";
  } catch {
    return false;
  }
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function waitForKoda(base, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isKodaApi(base)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  die(`API koda não ficou pronta a tempo: ${healthUrl(base)}`);
}

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
    shell: process.platform === "win32",
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

async function portBusy(port) {
  try {
    const res = await fetch(`http://localhost:${port}/health`, {
      redirect: "manual",
      signal: AbortSignal.timeout(2000),
    });
    return res.status > 0;
  } catch {
    return !(await canListen(port));
  }
}

async function resolveApiBase() {
  const hinted = (process.env.E2E_API_URL ?? "http://localhost:3000").replace(/\/api\/?$/, "");
  if (await isKodaApi(hinted)) {
    console.log("[e2e-stack] API koda já está no ar.");
    return hinted;
  }

  const ports = process.env.E2E_API_PORT
    ? [Number(process.env.E2E_API_PORT)]
    : [3099, 3100, 3101, 3102, 3103];

  for (const port of ports) {
    const base = `http://localhost:${port}`;
    if (await isKodaApi(base)) {
      console.log(`[e2e-stack] API koda encontrada na porta ${port}.`);
      return base;
    }
    if (await portBusy(port)) continue;

    console.log(`[e2e-stack] Iniciando API na porta ${port}…`);
    spawnLogged("api", npmExec, ["run", "dev"], {
      cwd: serverDir,
      env: {
        ...process.env,
        PORT: String(port),
        RATE_LIMIT_API_MAX: process.env.RATE_LIMIT_API_MAX ?? "1000",
        RATE_LIMIT_LOGIN_MAX: process.env.RATE_LIMIT_LOGIN_MAX ?? "100",
        RATE_LIMIT_AUTH_SENSITIVE_MAX: process.env.RATE_LIMIT_AUTH_SENSITIVE_MAX ?? "100",
      },
    });
    await waitForKoda(base);
    return base;
  }

  die("Nenhuma porta livre para subir o koda-server.");
  return "";
}

const apiBase = await resolveApiBase();

const viteEnv = {
  ...process.env,
  VITE_API_URL: apiBase,
};

if (await isUp(WEB_URL)) {
  console.log("[e2e-stack] Vite já está no ar.");
} else {
  console.log("[e2e-stack] Iniciando Vite…");
  spawnLogged("web", npmExec, ["run", "dev", "--", "--host", "localhost", "--port", "5173"], {
    cwd: webRoot,
    env: viteEnv,
  });
  await waitForUrl(WEB_URL, "Vite");
}

console.log("[e2e-stack] Stack pronta (API + web).");
