import common from './eslint.rules.js'
import { includeIgnoreFile } from '@eslint/config-helpers'
import { defineConfig } from 'eslint/config'
import { fileURLToPath } from 'node:url'

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url))

export default defineConfig([
  includeIgnoreFile(gitignorePath),
  // Astro pages hold routing and document markup; React and MDX sources carry the lint rules.
  { ignores: ['**/*.astro'] },
  ...common,
])
