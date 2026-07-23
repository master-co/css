import { defineConfig, devices } from '@playwright/test'

const port = 3000

export default defineConfig({
  testDir: '.',
  testMatch: 'inline-theme.spec.ts',
  fullyParallel: false,
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'line',
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'pnpm dev',
    cwd: new URL('../..', import.meta.url).pathname,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },
  projects: [{
    name: 'dev-desktop-chromium',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 900 }
    }
  }]
})
