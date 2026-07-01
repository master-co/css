import common from 'internal/eslint.config.js'
import { includeIgnoreFile } from '@eslint/compat'
import { defineConfig } from 'eslint/config'
import { fileURLToPath } from 'node:url'

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url))

export default defineConfig([
    includeIgnoreFile(gitignorePath),
    ...common,
])
