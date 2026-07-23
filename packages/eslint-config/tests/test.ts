import { ESLint } from 'eslint'
import { expect, test } from 'vitest'
import { masterCSS } from '@master/eslint-plugin-css'
import config, { recommended } from '../src/index'

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
