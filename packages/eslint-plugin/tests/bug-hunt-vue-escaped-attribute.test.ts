import { ESLint } from 'eslint'
import { expect, it } from 'vitest'
import * as parser from 'vue-eslint-parser'
import plugin from '../src'
import { createPresetManifest } from './helpers/create-preset-manifest'

function linter(fix: boolean) {
  return new ESLint({ fix, overrideConfigFile: true, overrideConfig: [{
    files: ['**/*.vue'], languageOptions: { parser }, plugins: { '@master/css': plugin },
    settings: { '@master/css': { manifest: createPresetManifest() } },
    rules: fix ? { '@master/css/sort-classes': 'error' }
      : { '@master/css/no-invalid-classes': ['error', { disallowUnknownClass: true }] }
  }] })
}

it('BH-0015 maps a Vue expression through both HTML entities and JavaScript escapes', async () => {
  const source = String.raw`<template><div :class="'fg:\u0072ed&#32;zzz'" /></template>`
  const [result] = await linter(false).lintText(source, { filePath: 'escape.vue' })
  expect(result.messages).toHaveLength(1)
  expect(result.messages[0]).toMatchObject({
    ruleId: '@master/css/no-invalid-classes',
    column: source.indexOf('zzz') + 1,
    endColumn: source.indexOf('zzz') + 4
  })
})

it('BH-0015 fixes the complete Vue source range without leaving entity fragments or invalid syntax', async () => {
  const source = String.raw`<template><div :class="'fg:white&#32;\u0062g:black'" /></template>`
  const [result] = await linter(true).lintText(source, { filePath: 'escape.vue' })
  expect(result.messages).toEqual([])
  expect(result.output).toBe(`<template><div :class="'bg:black fg:white'" /></template>`)
  const [stable] = await linter(true).lintText(result.output!, { filePath: 'escape.vue' })
  expect(stable.messages).toEqual([])
  expect(stable.output).toBeUndefined()
})
