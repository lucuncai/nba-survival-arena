import { expect, test } from "@playwright/test";

test("boots into a playable first wave without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(".");
  await expect(page).toHaveTitle(/Street Legends/);
  await expect(page.locator("#menu-screen")).toHaveClass(/screen-visible/, { timeout: 15_000 });
  await expect(page.locator("#game-container canvas")).toBeVisible();
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /user-scalable=no/);
  expect(await page.locator("#game-shell").evaluate((node) => getComputedStyle(node).touchAction)).toBe("none");
  expect(await page.locator('[data-action="skill1"]').evaluate((node) => getComputedStyle(node).touchAction)).toBe(
    "none",
  );

  await page.getByRole("button", { name: "LOCKER ROOM" }).click();
  await expect(page.locator("#locker-screen")).toHaveClass(/screen-visible/);
  await expect(page.locator("#locker-cards .upgrade-card")).not.toHaveCount(0);
  await page.getByRole("button", { name: "BACK TO MENU" }).click();
  await expect(page.locator("#locker-screen")).not.toHaveClass(/screen-visible/);

  await page.getByRole("button", { name: "ENTER THE COURT" }).click();
  await expect(page.locator("#tutorial-screen")).toHaveClass(/screen-visible/);
  await page.getByRole("button", { name: "GOT IT" }).click();

  await expect(page.locator("#tutorial-screen")).not.toHaveClass(/screen-visible/);
  await expect(page.locator("#hud")).toHaveClass(/hud-visible/);
  await expect(page.locator("#wave-label")).toContainText("WAVE 1");
  await expect(page.locator("#player-health-copy")).toContainText("320");
  await page.locator('[data-action="attack"]').click();
  await page.locator('[data-action="skill1"]').click();
  await page.locator('[data-action="skill2"]').click();
  await page.locator('[data-action="skill3"]').click();
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});
