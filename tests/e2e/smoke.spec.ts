import { test, expect } from "@playwright/test";
test("public landing and demo login are reachable", async ({ page }) => { await page.goto("/"); await expect(page.getByText("FACTOMEDIA").first()).toBeVisible(); await page.goto("/login"); await page.getByRole("button", { name: "Entrar en modo DEMO" }).click(); await expect(page.getByText("Hola, Mariana.")).toBeVisible(); });
