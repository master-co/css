import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: ['demo.spec.ts'],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 2,
  retries: 0,
  reporter: 'line',
  outputDir: '../../test-results/demo',
  use: { baseURL: process.env.DEMO_BASE_URL || 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-light', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 }, colorScheme: 'light' } },
    { name: 'mobile-dark', use: { ...devices['iPhone 13'], colorScheme: 'dark' } },
    { name: 'desktop-dark', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 }, colorScheme: 'dark' } },
    { name: 'mobile-light', use: { ...devices['iPhone 13'], colorScheme: 'light' } },
  ],
})
