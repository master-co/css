import { ESLint } from 'eslint'
import { expect, test } from 'vitest'
import plugin from '../src'
import { createPresetManifest } from './helpers/create-preset-manifest'

test('BH-0015 recognizes cooked JavaScript Unicode escapes in static class strings', async () => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{
      plugins: { '@master/css': plugin },
      settings: { '@master/css': { manifest: createPresetManifest() } },
      rules: { '@master/css/no-invalid-classes': ['error', { disallowUnknownClass: true }] }
    }]
  })
  const [control] = await eslint.lintText('clsx("block")', { filePath: 'audit.js' })
  expect(control.messages).toEqual([])
  const [escaped] = await eslint.lintText(String.raw`clsx("\u0062lock")`, { filePath: 'audit.js' })
  expect(escaped.messages).toEqual([])
})
