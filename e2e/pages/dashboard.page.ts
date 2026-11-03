import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { clickClear } from "../helpers/alerts";

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async expectShell() {
    await expect(this.page.locator(".dashboard-sidebar .logo")).toHaveText("Koda");
  }

  async clickSidebar(label: RegExp) {
    await clickClear(this.page.locator(".dashboard-sidebar").getByRole("button", { name: label }));
  }

  async openOperationsSubmenu() {
    const toggle = this.page.locator(".dashboard-sidebar").getByRole("button", {
      name: /Operações|Operations/i,
    });
    const expanded = await toggle.getAttribute("aria-expanded");
    if (expanded !== "true") {
      await clickClear(toggle);
    }
  }

  async openCargas() {
    await this.openOperationsSubmenu();
    await clickClear(this.page.locator(".dashboard-sidebar").getByRole("button", { name: /^Cargas$|^Loads$/i }));
  }

  async openViagens() {
    await this.openOperationsSubmenu();
    await clickClear(this.page.locator(".dashboard-sidebar").getByRole("button", { name: /^Viagens$|^Trips$/i }));
  }

  async openManagement(tab: RegExp) {
    await this.clickSidebar(/Gerenciamento|Management/i);
    await clickClear(this.page.locator(".management-tabs").getByRole("button", { name: tab }));
  }

  async readTheme(): Promise<string> {
    return this.page.evaluate(() => document.documentElement.getAttribute("data-theme") ?? "");
  }

  async toggleTheme() {
    await clickClear(this.page.locator(".dashboard-sidebar .theme-toggle"));
  }

  async logout() {
    await clickClear(this.page.locator(".dashboard-sidebar .btn-logout-link"));
  }

  async expectToast(message: RegExp) {
    await expect(this.page.getByRole("alert").filter({ hasText: message }).last()).toBeVisible({
      timeout: 20_000,
    });
  }
}
