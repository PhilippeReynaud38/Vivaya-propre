import { chromium, FullConfig } from '@playwright/test';
import { login } from './helpers/auth';

export default async function globalSetup(config: FullConfig) {
  const browser  = await chromium.launch();
  const context  = await browser.newContext();
  const page     = await context.newPage();

  await login(page);                       // ← helper qui fait le login

  await context.storageState({ path: 'storageState.json' });
  await browser.close();
}
