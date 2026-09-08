import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import plugin from '../../../../packages/eslint-plugin/dist/index.js'

const require = createRequire(new URL('../../../../packages/eslint-plugin/package.json', import.meta.url))
const { ESLint } = require('eslint')
const parser = require('vue-eslint-parser')
const manifest = JSON.parse(readFileSync(require.resolve('@master/css-preset/default-manifest.json'), 'utf8'))
const toolingRequire = createRequire(new URL('../../../../packages/tooling/package.json', import.meta.url))
const vue = toolingRequire.resolve('vue/dist/vue.global.prod.js')
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const cwd = mkdtempSync(join(tmpdir(), 'mastercss-eslint-vue-'))
try {
const eslint = new ESLint({ cwd, fix: true, overrideConfigFile: true, overrideConfig: [{
  files: ['**/*.vue'], languageOptions: { parser }, plugins: { '@master/css': plugin },
  settings: { '@master/css': { manifest } }, rules: { '@master/css/sort-classes': 'error' }
}] })
const expressions = [
  String.raw`:class="'fg:white&#32;\u0062g:black'"`,
  `:class="&quot;fg:white&Tab;bg:black&quot;"`,
  `:class="'fg:white content:&quot;A&amp;B&quot; bg:black'"`,
  `:class='"fg:white content:&#39;A&amp;B&#39; bg:black"'`,
  `:class="['fg:white&#32;bg:black', &quot;fg:black&#32;bg:white&quot;]"`,
  ':class="`fg:white&NewLine;bg:black`"',
  ':class="`fg:white content:\'\\${value}\'&#32;bg:black`"'
]
const cases = []
for (const expression of expressions) {
  const before = `<template><div id="target" ${expression} data-sentinel="unchanged"></div></template>`
  const [result] = await eslint.lintText(before, { filePath: 'attribute.vue' })
  assert.deepEqual(result.messages, [])
  assert(result.output)
  const [stable] = await eslint.lintText(result.output, { filePath: 'attribute.vue' })
  assert.deepEqual(stable.messages, [])
  assert.equal(stable.output, undefined)
  cases.push({ before, after: result.output })
}
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
  try {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setContent('<!doctype html><div id="app"></div>')
    await page.addScriptTag({ path: vue })
    for (const [index, entry] of cases.entries()) {
      const render = source => page.evaluate(template => {
        const host = document.querySelector('#app')
        const app = window.Vue.createApp({ template })
        app.mount(host)
        const target = host.querySelector('#target')
        const result = { classes: [...target.classList].sort(), sentinel: target.getAttribute('data-sentinel'),
          elements: host.querySelectorAll('*').length, attributes: [...target.attributes].map(attribute => attribute.name).sort() }
        app.unmount()
        return result
      }, source.slice('<template>'.length, -'</template>'.length))
      const before = await render(entry.before)
      const after = await render(entry.after)
      assert.deepEqual(after, before)
      assert.equal(after.sentinel, 'unchanged')
      assert.equal(after.elements, 1)
      assert.deepEqual(after.attributes, ['class', 'data-sentinel', 'id'])
      console.log(JSON.stringify({ browser: name, case: index, builtESLint: 'PASS', actualVueRuntimeCompiler: 'PASS', ...after }))
    }
    assert.deepEqual(errors, [])
  } finally { await browser.close() }
}
} finally { rmSync(cwd, { recursive: true, force: true }) }
