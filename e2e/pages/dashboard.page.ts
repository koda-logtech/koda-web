import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async expectShell() {
    await expect(this.page.locator(".dashboard-sidebar .logo")).toHaveText("Koda");
  }

  async clickSidebar(label: RegExp) {
    await this.page.locator(".dashboard-sidebar").getByRole("button", { name: label }).click();
  }

  async openOperationsSubmenu() {
    const toggle = this.page.locator(".dashboard-sidebar").getByRole("button", {
      name: /Operações|Operations/i,
    });
    const expanded = await toggle.getAttribute("aria-expanded");
    if (expanded !== "true") {
      await toggle.click();
    }
  }

  async openCargas() {
    await this.openOperationsSubmenu();
    await this.page.locator(".dashboard-sidebar").getByRole("button", { name: /^Cargas$|^Loads$/i }).click();
  }

  async openViagens() {
    await this.openOperationsSubmenu();
    await this.page.locator(".dashboard-sidebar").getByRole("button", { name: /^Viagens$|^Trips$/i }).click();
  }
}
