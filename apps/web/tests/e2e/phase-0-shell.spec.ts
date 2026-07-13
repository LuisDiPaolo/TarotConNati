import { expect, test } from "@playwright/test";

test("public surface renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Reservas online|Sin configuracion/i).first()).toBeVisible();
});

test("public host blocks direct panel path", async ({ page }) => {
  await page.goto("/panel");
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
  await expect(page.getByText(/Reservas online|Sin configuracion/i).first()).toBeVisible();
});

test("panel host redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("http://panel.localhost:3000/");
  await expect(page).toHaveURL(/\/panel\/login/);
  await expect(page.getByRole("heading", { name: /Login del negocio/i })).toBeVisible();
});
