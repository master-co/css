import js from '@eslint/js'
import '../../scripts/typescript-tooling-compat.mjs'
import { includeIgnoreFile } from '@eslint/compat'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import { fileURLToPath } from 'node:url'
import playwright from 'eslint-plugin-playwright'

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url))
// Dynamic so the compat hook above is registered before typescript-eslint loads.
const { default: ts } = await import('typescript-eslint')

export default ts.config(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs["flat/recommended"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ["**/*.svelte"],

    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    }
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
)
