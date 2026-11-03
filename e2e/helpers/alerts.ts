import { expect, type Locator, type Page } from "@playwright/test";

/** Fecha o modal de alerta térmico real para ele não bloquear o restante do fluxo. */
export async function dismissThermalAlerts(page: Page) {
  const dialog = page.getByRole("alertdialog");
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!(await dialog.isVisible())) return;
    const dismissAll = dialog.getByRole("button", { name: /Dispensar todos|Dismiss all/i });
    if (await dismissAll.isVisible()) {
      await dismissAll.click();
      continue;
    }
    await dialog.getByRole("button", { name: /Entendi|Got it|Próximo alerta|Next alert/i }).click();
  }
}

export async function clickClear(target: Locator) {
  await expect(async () => {
    await dismissThermalAlerts(target.page());
    await target.click({ timeout: 2_500 });
  }).toPass({ timeout: 20_000 });
}
