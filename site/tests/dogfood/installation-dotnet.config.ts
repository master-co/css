import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({
  ...foundations,
  testMatch: ['installation.spec.ts', 'installation-dotnet.spec.ts'],
  grep: /authored .NET assets|complete installation guide \/(aspnet-core|blazor)/,
  outputDir: '../../test-results/installation-dotnet',
})
