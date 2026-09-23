import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({
  ...foundations,
  testMatch: ['installation.spec.ts', 'installation-angular.spec.ts'],
  grep: /Angular application|complete installation guide \/angular/,
  outputDir: '../../test-results/installation-angular',
})
