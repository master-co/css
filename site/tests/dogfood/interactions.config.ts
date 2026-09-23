import { defineConfig, devices } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({
  ...positioning,
  testMatch: ['interactions.spec.ts', 'interactions-native.spec.ts'],
  outputDir: '../../test-results/interactions',
  projects: [
    ...positioning.projects!.map(project => ({ ...project, testMatch: ['interactions.spec.ts'] })),
    { name: 'webkit-pointer', testMatch: ['interactions-native.spec.ts'], grep: /native pointer/, use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 900 }, colorScheme: 'light' } },
    { name: 'chromium-touch', testMatch: ['interactions-native.spec.ts'], grep: /native touch/, use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, colorScheme: 'light' } },
  ],
})
