import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.MASTER_CSS_DOGFOOD_PORT || 4173)

export default defineConfig({
  testDir: '.',
  testMatch: 'site-css.spec.ts',
  fullyParallel: false,
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'line',
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node tests/dogfood/serve-static.mjs',
    cwd: new URL('../..', import.meta.url).pathname,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 }
      }
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['iPhone 13']
      }
    }
  ]
})
