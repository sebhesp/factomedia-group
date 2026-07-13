import { test, expect } from "@playwright/test";

test("public landing and demo login are reachable", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("FACTOMEDIA").first()).toBeVisible();

  await page.goto("/login/", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Entrar en modo DEMO" }).click();

  await expect(page).toHaveURL(/\/mi-dia\/?$/);
  await expect(page.getByRole("heading", { name: "Hola, Mariana." })).toBeVisible();
});

test("mobile more menu opens navigation tools", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile navigation is only rendered on mobile viewports.");

  await page.goto("/mi-dia/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Abrir.*secciones/ }).tap();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(/Distribuci/);
  await expect(page.getByRole("dialog")).toContainText("Aprendizajes");
  await expect(page.getByRole("dialog")).toContainText("Portada");
});

test("function guide explains the current page", async ({ page }) => {
  await page.goto("/mi-dia/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Abrir guía de funciones" }).click();

  const guide = page.getByRole("dialog", { name: "Guía de funciones" });
  await expect(guide).toBeVisible();
  await expect(guide).toContainText("Captura universal");
  await expect(guide).toContainText("Menú Más móvil");
  await expect(guide).toContainText("SIGUIENTE SUGERIDO");
});
