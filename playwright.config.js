var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Carrega `.env` do koda-web para E2E_ADMIN_* (não sobrescreve env já definido no shell). */
function loadDotEnv(filePath) {
    if (!fs.existsSync(filePath))
        return;
    var content = fs.readFileSync(filePath, "utf8");
    for (var _i = 0, _a = content.split("\n"); _i < _a.length; _i++) {
        var line = _a[_i];
        var trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#"))
            continue;
        var eq = trimmed.indexOf("=");
        if (eq === -1)
            continue;
        var key = trimmed.slice(0, eq).trim();
        if (!key || process.env[key] !== undefined)
            continue;
        var value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        process.env[key] = value;
    }
}
loadDotEnv(path.join(__dirname, ".env"));
var authFile = path.join(__dirname, "e2e/.auth/admin.json");
var hasAdminCredentials = Boolean(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);
export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["html", { open: "on-failure" }]],
    use: {
        baseURL: "http://localhost:5173",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    webServer: {
        command: "node scripts/e2e-stack.mjs",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
    projects: __spreadArray(__spreadArray([], (hasAdminCredentials
        ? [
            {
                name: "setup",
                testMatch: /auth\.setup\.ts/,
            },
        ]
        : []), true), [
        {
            name: "chromium",
            use: __assign(__assign({}, devices["Desktop Chrome"]), (hasAdminCredentials ? { storageState: authFile } : {})),
            dependencies: hasAdminCredentials ? ["setup"] : [],
            testIgnore: /auth\.setup\.ts/,
        },
    ], false),
});
