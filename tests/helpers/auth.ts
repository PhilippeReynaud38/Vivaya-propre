// tests/helpers/auth.ts
import { expect, Page } from '@playwright/test';

export async function login(page: Page) {
  // on part toujours de /login
  await page.goto('/login');

  /* ---- remplissage ---- */
  await page.getByTestId('login-email').fill('reynaudphilippe948@gmail.com');
  await page.getByTestId('login-password').fill('123456');

  /* ---- clic + attente redirection ---- */
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 15_000 }),
    page.getByTestId('login-submit').click()
  ]);

  await expect(page).toHaveURL(/\/dashboard/);
}
