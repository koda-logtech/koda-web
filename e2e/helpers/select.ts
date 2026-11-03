import { expect, type Locator } from "@playwright/test";
import { clickClear, dismissThermalAlerts } from "./alerts";

const PLACEHOLDER =
  /sem vínculo|no link|selecione um|select a|nenhum \(opcional\)|none \(optional\)/i;

export function customSelect(scope: Locator, label: RegExp): Locator {
  return scope
    .locator(".custom-select-wrapper")
    .filter({ has: scope.page().locator("label.select-label", { hasText: label }) })
    .first();
}

export async function readCustomOptions(scope: Locator, label: RegExp): Promise<string[]> {
  const field = customSelect(scope, label);
  await dismissThermalAlerts(scope.page());
  await clickClear(field.locator(".select-trigger"));
  const options = field.getByRole("option");
  await expect(options.first()).toBeVisible();
  const texts = (await options.allInnerTexts()).map((text) => text.replace(/\s+/g, " ").trim());
  await clickClear(field.locator(".select-trigger"));
  return texts;
}

export function realCustomOptions(options: string[]): string[] {
  return options.filter((text) => text.length > 0 && !PLACEHOLDER.test(text));
}

/**
 * Abre o select customizado e escolhe uma opção.
 * `prefer` restringe a busca; se nenhuma casar, usa a primeira opção real.
 */
export async function pickCustomSelect(
  scope: Locator,
  label: RegExp,
  options?: { prefer?: RegExp },
): Promise<string> {
  const field = customSelect(scope, label);
  await dismissThermalAlerts(scope.page());
  await clickClear(field.locator(".select-trigger"));
  const optionLocators = field.getByRole("option");
  await expect(optionLocators.first()).toBeVisible();
  const count = await optionLocators.count();
  const entries: { index: number; text: string }[] = [];

  for (let index = 0; index < count; index += 1) {
    const text = (await optionLocators.nth(index).innerText()).replace(/\s+/g, " ").trim();
    if (!text || PLACEHOLDER.test(text)) continue;
    entries.push({ index, text });
  }

  const chosen = entries.find((entry) => options?.prefer?.test(entry.text)) ?? entries[0];
  if (!chosen) {
    await clickClear(field.locator(".select-trigger"));
    throw new Error(`Nenhuma opção real no select ${label}`);
  }

  await clickClear(optionLocators.nth(chosen.index));
  return chosen.text;
}
