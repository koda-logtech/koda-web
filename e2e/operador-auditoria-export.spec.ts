import { test, expect, type Page } from "@playwright/test";
import { assertE2ECredentials } from "./e2e-credentials";
import { DashboardPage } from "./pages/dashboard.page";
import { dismissThermalAlerts } from "./helpers/alerts";
import { criarCargaEViagem, marcarViagemEntregue } from "./helpers/operacao";

async function auditExportState(page: Page): Promise<"ready" | "empty"> {
  const pdf = page.getByRole("button", { name: /Exportar Dossiê \(PDF\)|Export Dossier \(PDF\)/i });
  const tripSelect = page.locator("#audit-trip-select");
  await expect(pdf).toBeVisible();
  await expect(tripSelect).toBeVisible();

  let state: "ready" | "empty" | "" = "";
  await expect.poll(async () => {
    if (await pdf.isEnabled()) {
      state = "ready";
      return state;
    }
    const label = (await tripSelect.locator("option").first().textContent()) ?? "";
    if (/Nenhuma viagem entregue|No delivered trips/i.test(label)) {
      state = "empty";
      return state;
    }
    return "";
  }, { timeout: 20_000 }).not.toBe("");

  return state === "ready" ? "ready" : "empty";
}

test.describe("operador — auditoria e exportação", () => {
  test.beforeEach(() => {
    assertE2ECredentials();
  });

  test("abre a auditoria e exporta PDF e CSV", async ({ page }) => {
    test.setTimeout(180_000);
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.expectShell();
    await dashboard.clickSidebar(/Auditoria|Audit/i);
    await expect(page.getByRole("heading", { name: /^Auditoria$|^Audit$/i })).toBeVisible();

    if ((await auditExportState(page)) === "empty") {
      const created = await criarCargaEViagem(page, dashboard, {
        clientName: `E2E Audit ${Date.now().toString(36)}`,
      });
      await marcarViagemEntregue(page, dashboard, created.plate);
      await dashboard.clickSidebar(/Auditoria|Audit/i);
      await expect.poll(async () => auditExportState(page)).toBe("ready");
    }

    const pdfButton = page.getByRole("button", { name: /Exportar Dossiê \(PDF\)|Export Dossier \(PDF\)/i });
    const csvButton = page.getByRole("button", { name: /Exportar Dados \(CSV\)|Export Data \(CSV\)/i });
    await expect(pdfButton).toBeEnabled();
    await expect(csvButton).toBeEnabled();

    await dismissThermalAlerts(page);
    const [pdf] = await Promise.all([
      page.waitForEvent("download"),
      pdfButton.click(),
    ]);
    expect(pdf.suggestedFilename()).toMatch(/\.pdf$/i);
    await dashboard.expectToast(/Dossiê PDF gerado|Dossier PDF generated/i);

    await dismissThermalAlerts(page);
    const [csv] = await Promise.all([
      page.waitForEvent("download"),
      csvButton.click(),
    ]);
    expect(csv.suggestedFilename()).toMatch(/\.csv$/i);
    await dashboard.expectToast(/Dados exportados em CSV|Data exported to CSV/i);
  });
});
