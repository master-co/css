import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createToolingBinding } from '../../../../packages/binding/src/tooling-binding.ts'

const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = require('@playwright/test')
const names = JSON.parse(readFileSync(new URL('../evidence/0100-html-named-corpus.json', import.meta.url), 'utf8'))
const values = Object.keys(names).flatMap(name => [`x${name}-y`, `x${name}y`, `x${name}=y`])
for (const code of [...Array(256).keys(), 0xd7ff, 0xd800, 0xdfff, 0xe000, 0xfdd0, 0xfffe, 0xffff, 0x10000, 0x10ffff, 0x110000]) {
  values.push(`x&#${code};y`, `x&#x${code.toString(16)};y`, `x&#X${code.toString(16)}y`, `x&#${code}y`)
}
values.push('x&#99999999999999999999999999;y', 'x&#00000000000000000000000000;y', 'x&#;y', 'x&#x;y', 'x&unknown;y', 'x&amp;copy;y', 'x&&amp;y', 'x\0y', 'x&#11;y', 'x&nbsp;y')
const cases = values.flatMap(value => [
  `<div class="${value}"></div>`,
  `<div class='${value}'></div>`,
  `<div class=${value}></div>`
])
cases.push(
  '<div class=block title=x></div>',
  '<div class="block" CLASS="hidden"></div>',
  '<div class CLASS="hidden"></div>',
  '<!-- <div class="hidden"> --><div class="block"></div>',
  '<style>.x{content:\'<div class="hidden">\'}</style><div class="block"></div>',
  '<textarea><div class="hidden"></textarea><div class="block"></div>',
  '<svg><g class="a&amp;b"></g></svg>',
  '<svg><script/><g class="block"></g></svg>',
  '<math><mtext><textarea><div class=hidden></textarea><span class=block></span></mtext></math>',
  '<svg><title><a class="block"></a></title></svg>',
  '<svg><foreignObject><style>.x{content:\'<div class="hidden">\'}</style><div class="block"></div></foreignObject></svg>'
)
const files = cases.map((content, index) => ({ source: `${index}.html`, content, kind: 'html' }))
const actual = {}
for (const binding of ['native', 'wasm']) {
  const tooling = await createToolingBinding({ binding, wasm: { input: readFileSync(new URL('../../../../packages/binding-wasm-tooling/artifacts/mastercss_binding_wasm_tooling_bg.wasm', import.meta.url)) } })
  const session = await tooling.createSourceSession()
  try { actual[binding] = session.extract({ files }).files.map(file => file.candidates) }
  finally { session.dispose() }
}
assert.deepEqual(actual.native, actual.wasm)
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
  try {
    const page = await browser.newPage()
    const expected = await page.evaluate((cases) => cases.map(html => {
      const template = document.createElement('template')
      template.innerHTML = html
      return [...new Set([...template.content.querySelectorAll('*')].flatMap(element => [...element.classList]))]
    }), cases)
    for (let index = 0; index < cases.length; index++) {
      assert.deepEqual(actual.native[index], expected[index], `${name}: ${cases[index]}`)
    }
    console.log(JSON.stringify({ browser: name, namedReferences: Object.keys(names).length, quotedAndUnquotedCases: cases.length, native: 'PASS', wasm: 'PASS' }))
  } finally { await browser.close() }
}
