import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000
  },

  globalSetup: './playwright.global-setup.ts',

  use: {
    baseURL: 'http://localhost:3000',
    storageState: 'storageState.json'
  }
});
