import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { compileManifest, createCompiler } from '@master/css-compiler'
import { createToolingSessionSync } from '@master/css-tooling/node'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const document = readFileSync(new URL('../app/[locale]/guide/global-styles/content.mdx', import.meta.url), 'utf8')
function example(name: string) {
  const text = [...document.matchAll(/```\w+ name=([^\n]+)\n([\s\S]*?)```/g)].find(match => match[1].split('&')[0] === name)?.[2]
  assert.ok(text, `Missing ${name}`)
  return text
}

test('the maintenance guide compiles its actual CSS and markup examples', async () => {
  // The universal compiler receives the imported preset as resolved context.
  const source = example('maintenance.css').replace("@import '@master/css';", '')
  const html = example('maintenance.html')
  const { manifest, css } = await compileManifest(source, { baseManifest: preset as unknown as MasterCSSManifest })
  const tooling = createToolingSessionSync({ manifest })
  try {
    const classes = tooling.extractSource({ files: [{ source: 'maintenance.html', content: html, kind: 'html' }] }).files[0].candidates
    const native = new Set(['card-region', 'card', 'button', 'progress-fill'])
    for (const name of classes.filter(name => !native.has(name))) {
      const result = tooling.validateClassNames([name]).classes[0]
      assert.equal(result.matchStatus, 'matched', name)
      assert.notEqual(result.cssSyntaxStatus, 'invalid', name)
      assert.notEqual(result.cssValueStatus, 'invalid', name)
    }
    assert.match(css, /@container/)
    assert.match(css, /prefers-reduced-motion/)
    assert.match(css, /focus-visible/)
    assert.match(css, /scaleX\(var\(--progress/)
    const after = (await compileManifest(source.replace('--color-brand: #4f46e5', '--color-brand: #dc2626'), { baseManifest: preset as unknown as MasterCSSManifest })).manifest
    using compiler = await createCompiler()
    const common = { version: 1 as const, sources: [{ path: 'maintenance.html', classes }], stylesheets: [], outputs: [], excluded: [], unresolved: ['Browser states checked separately'] }
    const comparison = compiler.compareProjectSnapshots({ before: { ...common, manifest }, after: { ...common, manifest: after } })
    assert.deepEqual(comparison.classes.map(item => item.className), ['bg-brand', 'fg-brand'])
    assert.equal(comparison.coverage.browser, 'not-checked')
  } finally { tooling.dispose() }
})
