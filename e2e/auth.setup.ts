import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LoginPage } from "./pages/login.page";
import { assertE2ECredentials } from "./e2e-credentials";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, ".auth/admin.json");

setup("authenticate as admin", async ({ page }) => {
  const { email, password } = assertE2ECredentials();

  const login = new LoginPage(page);
  await login.goto();
  await login.login(email, password);

  await expect(page).not.toHaveURL(/\/login/);
  await page.context().storageState({ path: authFile });
});
