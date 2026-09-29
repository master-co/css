import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { compilePlayCSS } from '../../../../play-compiler/compile-play-css'

const compilerWasmURL = new URL('../../../../../packages/binding-wasm-compiler/artifacts/mastercss_binding_wasm_compiler_bg.wasm', import.meta.url)
const compilerWasmInput = new Uint8Array(readFileSync(compilerWasmURL))

function readFixture(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf-8')
}

function compileFixture(sourceCSS: string, classes: string[]) {
  return compilePlayCSS(sourceCSS, classes, { input: compilerWasmInput })
}

function extractClassNamesFromHTML(html: string) {
  return [...new Set([...html.matchAll(/\bclass\s*=\s*(["'])(.*?)\1/gs)]
    .flatMap((match) => match[2].split(/\s+/).filter(Boolean)))]
}

function assertUnverifiedCustomProperties(result: Awaited<ReturnType<typeof compileFixture>>) {
  assert.ok(result.warnings.includes('Unverified CSS value: color:var(--color-master-ink)'))
  assert.ok(result.warnings.every(message => message.startsWith('Unverified CSS value: ')))
  assert.ok(result.result.diagnostics.length > 0)
  assert.ok(result.result.diagnostics.every(diagnostic =>
    diagnostic.code === 'CSS_VALUE_UNKNOWN' && diagnostic.severity === 'information'))
}

test('compiles the starter Play template into generated CSS', async () => {
  const html = readFixture('../../../[locale]/play/templates/latest/example.html')
  const sourceCSS = readFixture('../../../[locale]/play/templates/latest/example.css')
  const result = await compileFixture(sourceCSS, extractClassNamesFromHTML(html))

  assert.match(result.css, /@layer theme/)
  assert.match(result.css, /@layer utilities/)
  assert.match(result.css, /@layer components/)
  assert.match(result.css, /\.btn\s*\{/)
  assert.match(result.css, /--color-master:/)
  assert.match(result.css, /--color-master-hover:/)
  assert.match(result.css, /--color-master-ink:/)
  assert.match(result.css, /--color-surface-base/)
  assert.match(result.css, /--color-surface-raised/)
  assert.match(result.css, /--color-text-body/)
  assert.match(result.css, /\.surface-raised\{/)
  assert.match(result.css, /\.fg-text-body\{/)
  assert.match(result.css, /\.btn\s*\{[\s\S]*?&:hover \.btn-arrow-line\s*\{\s*opacity:\s*1;\s*transform:\s*scale\(1\);\s*\}/)
  assertUnverifiedCustomProperties(result)
  assert.equal(result.result.manifest, result.manifest)
  assert.ok(result.css.length > 1000)
})

test('keeps native CSS while generating Play classes', async () => {
  const html = readFixture('../../../[locale]/play/templates/latest/example.html')
  const sourceCSS = readFixture('../../../[locale]/play/templates/latest/example.css') + '\n.native { color: var(--color-text-body); }'
  const result = await compileFixture(sourceCSS, extractClassNamesFromHTML(html))

  assert.match(result.css, /\.native\s*\{\s*color:\s*var\(--color-text-body\);\s*\}/)
  assert.match(result.css, /\.surface-raised\{/)
  assert.match(result.css, /\.btn\s*\{/)
  assert.match(result.css, /--color-text-body/)
  assert.match(result.css, /--color-master:/)
  assertUnverifiedCustomProperties(result)
})

test('delivers authored keyframes referenced by native CSS', async () => {
  const sourceCSS = '@keyframes fade { to { opacity: 1; } } .native { animation: fade 1s; }'
  const result = await compileFixture(sourceCSS, [])

  assert.match(result.css, /\.native\s*\{\s*animation:\s*(?:fade 1s|1s fade);\s*\}/)
  assert.match(result.css, /@keyframes fade/)
})

test('does not duplicate generated keyframes when native CSS defines them', async () => {
  const sourceCSS = [
    '@keyframes fade { to { opacity: .5; } }',
    '.native { animation-name: fade; animation-duration: 1s; }'
  ].join('\n')
  const result = await compileFixture(sourceCSS, [])
  const matches = result.css.match(/@keyframes fade/g) || []

  assert.equal(matches.length, 1)
  assert.match(result.css, /@keyframes\s+fade/)
  assert.match(result.css, /\.native\s*\{\s*animation-name:\s*fade;\s*animation-duration:\s*1s;\s*\}/)
})
