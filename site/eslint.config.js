import '../scripts/typescript-tooling-compat.mjs'
import common from './eslint.rules.js'
import { includeIgnoreFile } from '@eslint/config-helpers'
import { defineConfig } from 'eslint/config'
import { fileURLToPath } from 'node:url'

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url))

export default defineConfig([
  includeIgnoreFile(gitignorePath),
  ...common,
])
