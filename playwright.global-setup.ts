// playwright.global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

export default async function globalSetup(_: FullConfig) {
  const browser  = await chromium.launch();
  const context  = await browser.newContext();
  const page     = await context.newPage();

  /* ---------- LOGIN ---------- */
  await page.goto('http://localhost:3000/login');         // URL absolue
  await page.getByTestId('login-email').fill('reynaudphilippe948@gmail.com');
  await page.getByTestId('login-password').fill('123456');

  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 15_000 }),
    page.getByTestId('login-submit').click()
  ]);
  /* --------------------------- */

  await context.storageState({ path: 'storageState.json' });
  await browser.close();
}
