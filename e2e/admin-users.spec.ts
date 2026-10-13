import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { AdminPage } from "./pages/admin.page";
import { assertE2ECredentials } from "./e2e-credentials";

test.describe("admin login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(() => {
    assertE2ECredentials();
  });

  test("login redireciona para o dashboard", async ({ page }) => {
    const { email, password } = assertE2ECredentials();
    const login = new LoginPage(page);
    await login.goto();
    await login.login(email, password);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("admin usuários", () => {
  test.beforeEach(() => {
    assertE2ECredentials();
  });

  test("painel admin lista usuários (somente leitura)", async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.gotoAcessos();
    await admin.expectPanelLoaded();
    await admin.openUsersTab();
    await admin.expectUsersTable();
    await expect(page.getByPlaceholder(/Buscar por nome|Search by name/i)).toBeVisible();
  });

  test("aba solicitações de acesso", async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.gotoAcessos();
    await admin.openRequestsTab();
    await expect(page.getByRole("columnheader", { name: /^Nome$|^Name$/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^E-mail$|^Email$/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Status/i })).toBeVisible();
  });

  test("sidebar — atalho acessos admin", async ({ page }) => {
    await page.goto("/");
    await page.locator(".dashboard-sidebar").getByRole("button", { name: /Acessos Admin|Admin Access/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/acessos/);
    await new AdminPage(page).expectPanelLoaded();
  });
});
