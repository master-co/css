import { defineConfig, devices } from '@playwright/experimental-ct-svelte'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
    testDir: './',
    timeout: 10000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'list',
    use: {
        ctPort: 3100
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],
})
