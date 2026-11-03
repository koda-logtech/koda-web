import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { clickClear } from "../helpers/alerts";

/** Título do painel (i18n: PT ou EN). */
const ADMIN_PANEL_HEADING = /Painel Administrativo|Admin Dashboard/i;

export class AdminPage {
  constructor(private readonly page: Page) {}

  async gotoAcessos() {
    await this.page.goto("/admin/acessos");
  }

  async expectPanelLoaded() {
    await expect(this.page.getByRole("heading", { name: ADMIN_PANEL_HEADING })).toBeVisible();
  }

  async openRequestsTab() {
    await clickClear(this.page.getByRole("button", { name: /Solicitações de Acesso|Access Requests/i }));
  }

  async openUsersTab() {
    await clickClear(this.page.getByRole("button", { name: /Gerenciar Usuários|Manage Users/i }));
  }

  async expectUsersTable() {
    await this.page.getByRole("columnheader", { name: /Nome|Name/i }).waitFor();
    await this.page.getByRole("columnheader", { name: /E-mail|Email/i }).waitFor();
    await this.page.getByRole("columnheader", { name: /Perfil|Profile/i }).waitFor();
  }
}
