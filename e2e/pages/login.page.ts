import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async expectLoaded() {
    await this.page.getByRole("heading", { name: /Acessar Plataforma|Access Platform/i }).waitFor();
    await this.page.locator("#email").waitFor();
    await this.page.locator("#password").waitFor();
  }

  async login(email: string, password: string) {
    await this.page.locator("#email").fill(email);
    await this.page.locator("#password").fill(password);
    await this.page.getByRole("button", { name: /Entrar|Sign in|Log in/i }).click();
  }
}
