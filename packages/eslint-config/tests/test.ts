import { ESLint } from 'eslint'
import { expect, test } from 'vitest'
import { masterCSS } from '@master/eslint-plugin-css'
import config, { recommended } from '../src/index'

const css = config

test('exports the plugin-owned recommended flat config', () => {
  expect(config).toBe(recommended)
  expect(config).toBe(masterCSS.configs.recommended)
  expect(config).toHaveLength(1)
})

test('lints markup and leaves standalone stylesheets to CSS tooling', async () => {
  const eslint = new ESLint({ cwd: __dirname })
  const [markup] = await eslint.lintFiles('./index.html')
  expect(markup.errorCount).toBe(0)
  expect(markup.warningCount).toBe(4)

  const stylesheetESLint = new ESLint({
    cwd: __dirname,
    overrideConfigFile: true,
    overrideConfig: config
  })
  const [stylesheet] = await stylesheetESLint.lintText(
    '.btn { @compose contain:content; }',
    { filePath: 'index.css' }
  )
  expect(stylesheet.errorCount).toBe(0)
  expect(stylesheet.warningCount).toBe(1)
})

test('ESLint Configuration is valid', async () => {
  const eslint = new ESLint({ cwd: __dirname })
  const result = await eslint.lintFiles('./index.html')
  expect(result[0].errorCount).toBe(0)
  expect(result[0].warningCount).toBe(4)
  expect(result[0].messages.map((eachMessage) => eachMessage.message)).toEqual(
    [
      "Remove classes \"margin:0.625rem margin:1.25rem margin:2.5rem@sm\"; they are overridden by classes \"margin:1.875rem margin:3.125rem@sm\" in generated CSS.",
      "Sort classes into the expected order: \"display:block margin-bottom:3rem margin:2rem font-size:.75rem font-size:1.5rem@sm font-size:2rem@md\".",
      'Class "margin:2rem" overrides declarations from "margin-bottom:3rem" in generated CSS.',
      'Sort classes into the expected order: "width:error bg-indigo".',
    ]
  )
})

test('the default configuration does not lint or fix removed directives', async () => {
  const diagnosticESLint = new ESLint({
    cwd: __dirname,
    overrideConfigFile: true,
    overrideConfig: css
  })
  const fixESLint = new ESLint({
    cwd: __dirname,
    fix: true,
    overrideConfigFile: true,
    overrideConfig: css
  })
  const [diagnosticResult] = await diagnosticESLint.lintText('.btn { @compose contain:content; }', { filePath: 'index.css' })
  const [fixResult] = await fixESLint.lintText('.btn { @compose contain:content; }', { filePath: 'index.css' })

  expect(diagnosticResult.errorCount).toBe(0)
  expect(diagnosticResult.warningCount).toBe(1)
  expect(fixResult.output).toBeUndefined()
  expect(diagnosticResult.messages[0].message).toContain('no matching configuration')
  expect(await diagnosticESLint.isPathIgnored('index.css')).toBe(true)
})
