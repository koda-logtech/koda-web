import { test } from "@playwright/test";
import { assertE2ECredentials } from "./e2e-credentials";
import { DashboardPage } from "./pages/dashboard.page";
import { criarCargaEViagem } from "./helpers/operacao";

test.describe("operador — carga e viagem", () => {
  test.beforeEach(() => {
    assertE2ECredentials();
  });

  test("cadastra carga vinculada a caminhão e cria viagem com cliente", async ({ page }) => {
    test.setTimeout(120_000);
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectShell();
    await criarCargaEViagem(page, dashboard);
  });
});
