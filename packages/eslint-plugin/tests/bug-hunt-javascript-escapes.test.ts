import { ESLint } from 'eslint'
import { expect, it } from 'vitest'
import { parser } from 'typescript-eslint'
import * as vueParser from 'vue-eslint-parser'
import * as svelteParser from 'svelte-eslint-parser'
import plugin from '../src'
import { createPresetManifest } from './helpers/create-preset-manifest'

const manifest = createPresetManifest()
function linter(rules: Record<string, any>, fix = false, languageOptions: any = {}) {
  return new ESLint({ fix, overrideConfigFile: true, overrideConfig: [{
    files: ['**/*.{js,jsx,ts,vue,svelte}'],
    languageOptions: { parser, sourceType: 'script', parserOptions: { ecmaFeatures: { jsx: true } }, ...languageOptions },
    plugins: { '@master/css': plugin }, settings: { '@master/css': { manifest } },
    rules: Object.fromEntries(Object.entries(rules).map(([name, options]) => [`@master/css/${name}`, options]))
  }] })
}
const invalid = { 'no-invalid-classes': ['error', { disallowUnknownClass: true }] }
const validStrings = [
  String.raw`"\u0062lock"`, String.raw`'\u{62}lock'`, String.raw`"\x62lock"`,
  String.raw`"blo\ck"`,
  String.raw`"block\u0020hidden"`, String.raw`"block\x20hidden"`, String.raw`"block\nhidden"`,
  String.raw`"block\thidden"`, String.raw`"block\rhidden"`, String.raw`"block\fhidden"`,
  '"blo\\\nck"', '"blo\\\r\nck"', '"blo\\\u2028ck"',
  '`\\u0062lock`', '`block\r\nhidden`', String.raw`"content:'\u{1F600}'"`,
  String.raw`"content:'\uD83D\uDE00'"`, String.raw`"content:'\\b'"`
]
it.each(validStrings)('recognizes the parser cooked value of %s', async literal => {
  const [result] = await linter(invalid).lintText(`clsx(${literal})`, { filePath: 'escape.js' })
  expect(result.messages).toEqual([])
})

it.each([String.raw`\u007Azz`, String.raw`z\x7Az`, 'z\\\nzz', String.raw`\u{1F600}zzz`])('maps unknown-class diagnostics to the complete raw span %s', async raw => {
  const source = `/* 😀 */ clsx("block ${raw} hidden")`
  const [result] = await linter(invalid).lintText(source, { filePath: 'escape.js' })
  expect(result.messages).toHaveLength(1)
  expect(result.messages[0].ruleId).toBe('@master/css/no-invalid-classes')
  const location = (offset: number) => {
    const lines = source.slice(0, offset).split('\n')
    return { line: lines.length, column: lines.at(-1)!.length + 1 }
  }
  const start = location(source.indexOf(raw))
  const end = location(source.indexOf(raw) + raw.length)
  expect(result.messages[0]).toMatchObject({ ...start, endLine: end.line, endColumn: end.column })
})

function cooked(source: string) {
  const { ast: program }: any = parser.parseForESLint(source, { sourceType: 'script', ecmaVersion: 2022 })
  const node = program.body[0].expression.arguments[0]
  return node.type === 'TemplateLiteral' ? node.quasis[0].value.cooked : node.value
}

it('recognizes legacy octal escapes when the JavaScript parser accepts them', async () => {
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: [{
    languageOptions: { sourceType: 'script' }, plugins: { '@master/css': plugin },
    settings: { '@master/css': { manifest } }, rules: { '@master/css/no-invalid-classes': invalid['no-invalid-classes'] }
  }] })
  const [result] = await eslint.lintText(String.raw`clsx("\142lock")`, { filePath: 'legacy.js' })
  expect(result.messages).toEqual([])
})
it.each([
  String.raw`clsx("fg-white \u0062g:black")`,
  String.raw`clsx("fg:white\u0020bg:black")`,
  String.raw`clsx('fg-white content:\'a\\b\' bg-black')`,
  'clsx(`fg-white content:\'\\${value}\' bg-black`)',
  'clsx(`\n fg:white\n bg:black\n`)',
  'clsx("fg:white\\\n bg-black")'
])('sorts escaped strings with valid syntax, equivalent classes and stable fixes: %s', async source => {
  const eslint = linter({ 'sort-classes': 'error' }, true)
  const [result] = await eslint.lintText(source, { filePath: 'escape.js' })
  expect(result.messages).toEqual([])
  expect(result.output).toBeDefined()
  const [control] = await eslint.lintText(`clsx(${JSON.stringify(cooked(source))})`, { filePath: 'plain.js' })
  expect(cooked(result.output!)).toBe(cooked(control.output ?? `clsx(${JSON.stringify(cooked(source))})`))
  const [again] = await eslint.lintText(result.output!, { filePath: 'escape.js' })
  expect(again.messages).toEqual([])
  expect(again.output).toBeUndefined()
})

it('maps conflict removal and canonical replacement through escaped separators', async () => {
  const eslint = linter({ 'sort-classes': 'error', 'no-conflicting-classes': 'error', 'prefer-canonical-classes': 'error' }, true)
  const [result] = await eslint.lintText(String.raw`clsx('padding-md\u0020p:8px \u0062lock')`, { filePath: 'escape.js' })
  expect(result.messages).toEqual([])
  expect(cooked(result.output!)).toBe('block p:8px')
  const [again] = await eslint.lintText(result.output!, { filePath: 'escape.js' })
  expect(again.output).toBeUndefined()
})

it('uses cooked policy values and original ranges for unapproved raw values', async () => {
  const raw = String.raw`fg:\u0023ff0000`
  const source = `clsx("${raw}")`
  const [result] = await linter({ 'no-unapproved-raw-values': 'error' }).lintText(source, { filePath: 'escape.js' })
  expect(result.messages).toHaveLength(1)
  expect(result.messages[0]).toMatchObject({ ruleId: '@master/css/no-unapproved-raw-values', column: 7, endColumn: 7 + raw.length })
})

it.each([
  ['jsx', String.raw`const view = <div className={"\u0062lock"} />`, undefined],
  ['vue', String.raw`<template><div :class="'\u0062lock'" /></template>`, vueParser],
  ['svelte', String.raw`<div class={'\u0062lock'} />`, svelteParser]
])('recognizes JavaScript expression escapes inside %s', async (extension, source, frameworkParser) => {
  const [result] = await linter(invalid, false, frameworkParser ? { parser: frameworkParser } : {}).lintText(source as string, { filePath: `escape.${extension}` })
  expect(result.messages).toEqual([])
})

it.each([
  ['jsx', String.raw`const view = <div className="\u0062lock" />`, undefined],
  ['vue', String.raw`<template><div class="\u0062lock" /></template>`, vueParser],
  ['svelte', String.raw`<div class="\u0062lock" />`, svelteParser]
])('does not apply JavaScript decoding to raw %s attributes', async (extension, source, frameworkParser) => {
  const [result] = await linter(invalid, false, frameworkParser ? { parser: frameworkParser } : {}).lintText(source as string, { filePath: `escape.${extension}` })
  expect(result.messages).toHaveLength(1)
  expect(result.messages[0].ruleId).toBe('@master/css/no-invalid-classes')
})
