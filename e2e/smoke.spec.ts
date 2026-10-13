import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";

test.describe("smoke", () => {
  test("página de login carrega", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.expectLoaded();
    await expect(page).toHaveURL(/\/login/);
  });
});
