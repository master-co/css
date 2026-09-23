import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({
  ...foundations,
  testMatch: ['installation.spec.ts', 'installation-storybook.spec.ts'],
  grep: /authored story preview|complete installation guide \/storybook/,
  outputDir: '../../test-results/installation-storybook',
})
