import { test, expect } from '@playwright/test';

test('chat › user can send a message', async ({ page }) => {
  // la session est injectée depuis storageState.json
  await page.goto('/chat/106fd2ed-72ab-42cd-a896-78ab28a0d2bc');

  const input   = page.getByTestId('chat-input');
  const sendBtn = page.getByRole('button', { name: /envoyer/i });

  await input.fill('hello');
  await sendBtn.click();

  // message rendu immédiatement dans le DOM
  await expect(page.getByText('hello').first()).toBeVisible();
});
