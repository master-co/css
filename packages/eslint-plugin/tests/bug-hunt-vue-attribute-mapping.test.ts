import { ESLint } from 'eslint'
import { expect, it } from 'vitest'
import * as parser from 'vue-eslint-parser'
import plugin from '../src'
import { createPresetManifest } from './helpers/create-preset-manifest'

const settings = { '@master/css': { manifest: createPresetManifest() } }
function linter(fix: boolean, vue = true) {
  return new ESLint({ fix, overrideConfigFile: true, overrideConfig: [{
    files: ['**/*.{vue,js}'], languageOptions: vue ? { parser } : {}, plugins: { '@master/css': plugin }, settings,
    rules: fix ? { '@master/css/sort-classes': 'error' } : { '@master/css/no-invalid-classes': ['error', { disallowUnknownClass: true }] }
  }] })
}

it.each([
  ['&#32;', 'zzz'], ['&Tab;', String.raw`\u007Azz`], ['&NewLine;', 'zzz'],
  ['&#x20;', '&#122;zz'], ['&nbsp;', 'zzz'], ['&#32;', '&NotEqualTilde;zzz'],
  ['&#32;', '&#x1f600;zzz'], ['&#32;', '&#92;u007Azz']
])('maps raw diagnostic spans with separator %s and token %s', async (separator, token) => {
  // NBSP is inside a class token; use it in a harmless preceding comment instead.
  const prefix = separator === '&nbsp;' ? '/* &nbsp; */ ' : ''
  const quote = separator === '&NewLine;' ? '`' : "'"
  const source = `<template><div :class="${prefix}${quote}${separator === '&nbsp;' ? '' : 'block' + separator}${token}${quote}"></div></template>`
  const [result] = await linter(false).lintText(source, { filePath: 'mapping.vue' })
  expect(result.messages).toHaveLength(1)
  expect(result.messages[0]).toMatchObject({
    ruleId: '@master/css/no-invalid-classes',
    column: source.indexOf(token) + 1, endColumn: source.indexOf(token) + token.length + 1
  })
})

it('maps diagnostics after a literal CRLF and an astral character in the source prefix', async () => {
  const source = '<template><!-- 😀 --><div :class="`block\r\n&#122;zz`"></div></template>'
  const [result] = await linter(false).lintText(source, { filePath: 'mapping.vue' })
  expect(result.messages).toHaveLength(1)
  expect(result.messages[0]).toMatchObject({
    ruleId: '@master/css/no-invalid-classes', line: 2, column: 1, endLine: 2, endColumn: 9
  })
})

function classValues(source: string) {
  const parsed = parser.parseForESLint(source, { sourceType: 'module' })
  expect(parsed.ast.templateBody?.errors ?? []).toEqual([])
  const attributes = (parsed.ast.templateBody!.children.find((node: any) => node.type === 'VElement') as any).startTag.attributes
  expect(attributes).toHaveLength(2)
  expect(attributes[1].key.name).toBe('data-sentinel')
  expect(attributes[1].value.value).toBe('unchanged')
  const values: string[] = []
  const visit = (node: any) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'Literal' && typeof node.value === 'string') { values.push(node.value); return }
    if (node.type === 'TemplateElement') { values.push(node.value.cooked); return }
    for (const key of Object.keys(node)) if (!['parent', 'loc', 'range', 'tokens', 'comments'].includes(key)) {
      if (Array.isArray(node[key])) node[key].forEach(visit)
      else visit(node[key])
    }
  }
  visit(attributes[0].value.expression)
  return values
}

const expressions = [
  String.raw`:class="'fg:white&#32;\u0062g:black'"`,
  `:class="&quot;fg:white&#32;bg:black&quot;"`,
  `:class='&quot;fg:white&#32;bg:black&quot;'`,
  `:class="&#39;fg:white&Tab;bg:black&#39;"`,
  `:class="['fg:white&#32;bg:black', &quot;fg:black&#32;bg:white&quot;]"`,
  `:class="'fg:white content:&quot;a&amp;b&quot; bg:black'"`,
  `:class='"fg:white content:&#39;a&amp;b&#39; bg:black"'`,
  ':class="`fg:white&NewLine;bg:black`"',
  ':class="`fg:white\r\nbg:black`"',
  ':class="`fg:white content:\'\\${value}\'&#32;bg:black`"',
  ':class="\'fg:white content:&quot;&amp;not=literal&quot; bg:black\'"'
]
it.each(expressions)('preserves AST class values, attribute boundaries and fix stability for %s', async expression => {
  const source = `<template><div ${expression} data-sentinel="unchanged"></div></template>`
  const before = classValues(source)
  const controls = await Promise.all(before.map(async value => {
    const [result] = await linter(true, false).lintText(`clsx(${JSON.stringify(value)})`, { filePath: 'control.js' })
    expect(result.messages).toEqual([])
    const control: any = parser.parseForESLint(result.output ?? `clsx(${JSON.stringify(value)})`, { sourceType: 'module' })
    return control.ast.body[0].expression.arguments[0].value
  }))
  const [result] = await linter(true).lintText(source, { filePath: 'mapping.vue' })
  expect(result.messages).toEqual([])
  expect(result.output).toBeDefined()
  expect(classValues(result.output!)).toEqual(controls)
  const [stable] = await linter(true).lintText(result.output!, { filePath: 'mapping.vue' })
  expect(stable.messages).toEqual([])
  expect(stable.output).toBeUndefined()
})
