import { test, expect } from "@playwright/test";
import { assertE2ECredentials } from "./e2e-credentials";
import { DashboardPage } from "./pages/dashboard.page";

test.describe("dashboard — navegação principal", () => {
  test.beforeEach(() => {
    assertE2ECredentials();
  });

  test.beforeEach(async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectShell();
  });

  test("visão geral", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Visão Geral da Operação|Operation Overview/i }),
    ).toBeVisible();
  });

  test("monitoramento", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.clickSidebar(/Monitoramento|Monitoring/i);
    await expect(page.locator(".monitoring-full-bleed, .map-section").first()).toBeVisible();
  });

  test("cargas", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.openCargas();
    await expect(page.getByRole("heading", { name: /^Cargas$|^Loads$/i })).toBeVisible();
  });

  test("viagens", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.openViagens();
    await expect(page.getByRole("heading", { name: /^Viagens$|^Trips$/i })).toBeVisible();
  });

  test("gerenciamento — motoristas", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.clickSidebar(/Gerenciamento|Management/i);
    await expect(
      page.getByRole("button", { name: /Motoristas|Drivers/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Novo Cadastro|New Registration/i }),
    ).toBeVisible();
  });

  test("alertas térmicos", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.clickSidebar(/Alertas|Alerts/i);
    await expect(
      page.getByRole("heading", { name: /Alertas térmicos|Thermal alerts/i }),
    ).toBeVisible();
  });

  test("auditoria", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.clickSidebar(/Auditoria|Audit/i);
    await expect(page.getByRole("heading", { name: /^Auditoria$|^Audit$/i })).toBeVisible();
  });
});
