import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { planMasterCSSSetup } from '../src'

function createProject(packageJSON: Record<string, unknown>, files: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'master-css-create-eslint-'))
  writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module', ...packageJSON }), 'utf8')
  for (const [file, content] of Object.entries(files)) writeFileSync(join(root, file), content, 'utf8')
  return root
}

const eslintFiles = (plan: ReturnType<typeof planMasterCSSSetup>) => plan.files.filter(file => file.path.startsWith('eslint.config.'))
const parserWarnings = (plan: ReturnType<typeof planMasterCSSSetup>) => plan.warnings.filter(warning => warning.includes('configures no parser'))

test('updates the existing ESLint config instead of creating a config that would shadow it', () => {
  const root = createProject({ dependencies: { next: '^16.0.0' } }, {
    'eslint.config.mjs': "import { defineConfig } from 'eslint/config'\nimport next from 'eslint-config-next'\n\nexport default defineConfig([\n  ...next\n])\n"
  })
  const plan = planMasterCSSSetup({ root, mcp: false, ai: false })
  expect(eslintFiles(plan).map(file => [file.path, file.action])).toEqual([['eslint.config.mjs', 'update']])
  expect(eslintFiles(plan)[0].content).toContain('...masterCSS,')
})

test('leaves CommonJS ESLint configs to the user with a warning', () => {
  const root = createProject({}, { 'eslint.config.cjs': 'module.exports = []\n' })
  const plan = planMasterCSSSetup({ root, framework: 'vite', mcp: false, ai: false })
  expect(eslintFiles(plan)).toEqual([])
  expect(plan.warnings.some(warning => warning.startsWith('eslint.config.cjs is a CommonJS ESLint config'))).toBe(true)
})

test('warns when the ESLint config has no parser for the framework source files', () => {
  const root = createProject({ dependencies: { astro: '^7.0.0', typescript: '^6.0.0' } }, { 'astro.config.mjs': 'export default {}\n' })
  const plan = planMasterCSSSetup({ root, mcp: false, ai: false })
  expect(plan.framework).toBe('astro')
  const warnings = parserWarnings(plan)
  expect(warnings).toHaveLength(2)
  expect(warnings[0]).toContain('eslint.config.js configures no parser for .astro files')
  expect(warnings[0]).toContain('astro-eslint-parser')
  expect(warnings[1]).toContain('.ts and .tsx files')
})

test('does not warn about parsers the ESLint config already sets up', () => {
  const root = createProject({ dependencies: { vue: '^3.5.0', typescript: '^6.0.0' } }, {
    'vite.config.ts': 'export default {}\n',
    'eslint.config.js': "import pluginVue from 'eslint-plugin-vue'\nimport tseslint from 'typescript-eslint'\n\nexport default [\n  ...pluginVue.configs['flat/recommended']\n]\n"
  })
  const plan = planMasterCSSSetup({ root, framework: 'vue', mcp: false, ai: false })
  expect(parserWarnings(plan)).toEqual([])
  expect(planMasterCSSSetup({ root, framework: 'vue', eslint: false, mcp: false, ai: false }).warnings.some(warning => warning.includes('ESLint'))).toBe(false)
})
