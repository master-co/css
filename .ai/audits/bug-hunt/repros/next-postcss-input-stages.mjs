import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
const require = createRequire(new URL('../../../../packages/compiler/package.json', import.meta.url))
const { inspectCSS } = await import(pathToFileURL(require.resolve('@master/css-compiler')))
const { compileStylesheet, compileRenderedStylesheet } = await import(pathToFileURL(require.resolve('@master/css-compiler/stylesheet')))
const { defaultBuildManifest } = await import(pathToFileURL(require.resolve('@master/css-internal/project')))
const nextRequire = createRequire(createRequire(join(process.env.BH_NEXT_PACKAGE_DIR, 'package.json')).resolve('next/package.json'))
const postcss = nextRequire('postcss')
const root = mkdtempSync(join(tmpdir(), 'next-postcss-input-stages-'))
const rows = []
const expectPreservedEmpty = process.env.BH_EXPECT_PRESERVED_EMPTY === '1'
try {
  for (const [name, source] of Object.entries({
    empty: '.shared{}',
    nested: '@media screen{.shared{}}',
    themedEmpty: '@theme{--color-unused:red}.shared{}',
    spellings: '/* before */.shared{color:rgb(255, 0, 0);margin:0px 0px 0px 0px}',
    merged: '.shared{color:red}.sibling{color:red}'
  })) {
    const file = join(root, name + '.module.css')
    writeFileSync(file, source)
    const inspection = await inspectCSS(source)
    const lowered = await compileStylesheet(file, source, { baseManifest: defaultBuildManifest, preserveNativeCSS: true })
    function observe(css) {
      const tree = postcss.parse(css), rules = [], declarations = [], comments = []
      tree.walkRules(rule => rules.push(rule.selector))
      tree.walkDecls(decl => declarations.push({ property: decl.prop, value: decl.value }))
      tree.walkComments(comment => comments.push(comment.text))
      return { rules, declarations, comments }
    }
    const original = observe(source), compiled = observe(lowered.css)
    rows.push({ name, source, inspection, lowered: lowered.css, original, compiled,
      routed: inspection.hasMasterEntry || inspection.directives.length ? 'lowered' : 'original' })
    if (name === 'empty' || name === 'nested' || name === 'themedEmpty') {
      assert(original.rules.includes('.shared'))
      assert.equal(compiled.rules.includes('.shared'), expectPreservedEmpty, 'explicit baseline/prototype empty-rule expectation')
    }
  }
  const file = join(root, 'globals.module.css')
  const source = '@theme{--color-audit:#111111;--color-late:#abcdef}.direct{color:var(--color-audit)}'
  writeFileSync(file, source)
  const prepared = await compileRenderedStylesheet(file, source, { baseManifest: defaultBuildManifest, preserveNativeCSS: true })
  let onceCalls = 0
  const processed = await postcss([{ postcssPlugin: 'audit-once-global-reference', Once(tree) {
    onceCalls++
    tree.walkDecls('--color-audit', decl => { decl.value = '#123456' })
    tree.walkRules(rule => { if (rule.selector === '.direct') rule.append({ prop: 'background-color', value: 'var(--color-late)' }) })
  } }]).process(prepared.css, { from: file, to: file, map: false })
  const emptyManifest = await compileRenderedStylesheet(file, processed.css, { baseManifest: { version: 1, utilities: [] }, preserveNativeCSS: true })
  const fullManifest = await compileRenderedStylesheet(file, processed.css, { baseManifest: prepared.manifest, preserveNativeCSS: true })
  function values(css, prop) { const out = [];postcss.parse(css).walkDecls(prop, decl => out.push(decl.value));return out }
  assert.equal(onceCalls, 1)
  assert.equal(values(prepared.generatedCSS, '--color-late').length, 0)
  assert.equal(values(emptyManifest.css, '--color-late').length, 0)
  assert(values(fullManifest.css, '--color-late').length > 0)
  assert.equal(values(processed.css, '--color-audit').at(-1), '#123456')
  assert.notEqual(values(fullManifest.css, '--color-audit').at(-1), '#123456', 'whole-manifest regeneration overwrites the PostCSS edit')
  rows.push({ name: 'late-global-reference', source, preflight: prepared.css, processed: processed.css, onceCalls,
    emptyManifest: { css: emptyManifest.css, generated: emptyManifest.generatedCSS },
    fullManifest: { css: fullManifest.css, generated: fullManifest.generatedCSS },
    processedExistingValues: values(processed.css, '--color-audit'),
    regeneratedExistingValues: values(fullManifest.css, '--color-audit'),
    limitation: 'Empty manifest drops the new reference; blindly restoring the whole manifest emits pre-PostCSS values again. This stage inspection is not a host fix and does not authorize rerunning arbitrary plugins.' })
} finally { rmSync(root, { recursive: true, force: true }) }
const result = { scope: 'Public Rust-backed inspection/lowering/render APIs and actual Next PostCSS input observations; no semantic replacement or global-closure fix', expectPreservedEmpty, bindingOverride: process.env.MASTER_CSS_NATIVE_BINDING_PATH ?? null, rows }
writeFileSync(process.env.BH_NEXT_STAGE_EVIDENCE, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
