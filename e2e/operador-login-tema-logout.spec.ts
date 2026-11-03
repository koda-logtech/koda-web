import { test, expect } from "@playwright/test";
import { assertE2ECredentials } from "./e2e-credentials";
import { LoginPage } from "./pages/login.page";
import { DashboardPage } from "./pages/dashboard.page";

test.describe("operador — login, tema e logout", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(() => {
    assertE2ECredentials();
  });

  test("entra no dashboard, alterna dark/light e sai", async ({ page }) => {
    test.setTimeout(60_000);
    const { email, password } = assertE2ECredentials();
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    await login.goto();
    await login.expectLoaded();
    await login.login(email, password);

    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/$/);
    await dashboard.expectShell();
    await expect(
      page.getByRole("heading", { name: /Visão Geral da Operação|Operation Overview/i }),
    ).toBeVisible();

    const themeBefore = await dashboard.readTheme();
    const toggle = page.locator(".dashboard-sidebar .theme-toggle");
    await expect(toggle).toContainText(/Modo Escuro|Modo Claro|Dark Mode|Light Mode/i);

    await dashboard.toggleTheme();
    await expect.poll(() => dashboard.readTheme()).not.toBe(themeBefore);
    const themeAfter = await dashboard.readTheme();
    expect(["light", "dark"]).toContain(themeAfter);

    await dashboard.toggleTheme();
    await expect.poll(() => dashboard.readTheme()).toBe(themeBefore);

    await dashboard.logout();
    await expect(page).toHaveURL(/\/login/);
    await login.expectLoaded();
  });
});
