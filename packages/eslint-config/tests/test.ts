import { ESLint } from 'eslint'
import { expect, test } from 'vitest'
import { masterCSS } from '@master/eslint-plugin-css'
import config, { recommended } from '../src/index'

const css = config

test('exports the plugin-owned recommended flat config', () => {
  expect(config).toBe(recommended)
  expect(config).toBe(masterCSS.configs.recommended)
  expect(config).toHaveLength(2)
})

test('lints markup and standalone stylesheets', async () => {
  const eslint = new ESLint({ cwd: __dirname })
  const [markup] = await eslint.lintFiles('./index.html')
  expect(markup.errorCount).toBe(0)
  expect(markup.warningCount).toBe(9)

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
  expect(result[0].warningCount).toBe(9)
  expect(result[0].messages.map((eachMessage) => eachMessage.message)).toEqual(
    [
      'Sort classes into the expected order: "m:0.625rem m:1.875rem m:5x m:3.125rem@sm m:10x@sm".',
      'Remove classes "m:0.625rem m:5x m:10x@sm"; they are overridden by later classes "m:1.875rem m:3.125rem@sm".',
      'Sort classes into the expected order: "block m:8x mb:12x font:.75rem font:1.5rem@sm font:2rem@md".',
      'Use canonical class "font:xs" instead of "font:.75rem".',
      'Use canonical class "font:2xl@sm" instead of "font:1.5rem@sm".',
      'Replace "m:8x" with "mx:8x mt:8x"; later class "mb:12x" overrides part of "m:8x".',
      'Use canonical class "m:xl" instead of "m:8x".',
      'Use canonical class "font:3xl@md" instead of "font:2rem@md".',
      'Use canonical class "mb:2xl" instead of "mb:12x".',
    ]
  )
})

test('Default ESLint configuration lints standalone stylesheets', async () => {
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
  expect(fixResult.output).toBe('.btn { contain: content; }')
})
