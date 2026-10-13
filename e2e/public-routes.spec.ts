import { test, expect } from "@playwright/test";

test.describe("rotas públicas", () => {
  test("solicitar acesso exibe formulário", async ({ page }) => {
    await page.goto("/solicitar-acesso");
    await expect(page.getByRole("heading", { name: /Solicitar Acesso|Request Access/i })).toBeVisible();
    await expect(page.locator("#nome")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.getByRole("button", { name: /Enviar Solicitação|Submit Request/i })).toBeVisible();
  });

  test("login link para solicitar acesso", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Solicitar Acesso|Request Access/i }).click();
    await expect(page).toHaveURL(/\/solicitar-acesso/);
  });

  test("ativar conta sem token exibe link inválido", async ({ page }) => {
    await page.goto("/ativar-conta");
    await expect(page.getByRole("heading", { name: /Link Inválido|Invalid Link/i })).toBeVisible();
  });

  test("rota inexistente exibe 404", async ({ page }) => {
    await page.goto("/rota-que-nao-existe-e2e");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Página não encontrada|Page not found/i })).toBeVisible();
  });
});
