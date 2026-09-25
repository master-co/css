import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, join } from 'node:path'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const option = name => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined
const count = Number(option('--count') || 1000)
const baseline = option('--baseline-binding')
const baselineArtifacts = option('--baseline-artifacts')
const median = values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]
const measure = callback => {
  for (let i = 0; i < 3; i++) callback()
  const times = []
  for (let i = 0; i < 9; i++) {
    const start = performance.now()
    callback()
    times.push(performance.now() - start)
  }
  return median(times)
}
const bytes = value => ({ raw: Buffer.byteLength(value), gzip: gzipSync(value).byteLength })
const browser = await chromium.launch()
const page = await browser.newPage()
const results = {}
try {
  for (const [label, path] of [['current', `${root}packages/binding/artifacts/mastercss.node`], ...(baseline ? [['baseline', baseline]] : [])]) {
    const binding = require(path)
    const compile = source => {
      const parsed = JSON.parse(binding.compileCssDirectivesJson(source, '{}'))
      return JSON.parse(binding.lowerCssDirectivesJson(JSON.stringify({
        manifestInput: parsed.manifestInput, nativeOutput: parsed.nativeOutput,
        styleDefinitions: parsed.styleDefinitions || [], warnings: parsed.warnings,
        utilitySources: parsed.utilitySources || []
      }), '{}'))
    }
    results[label] = { versions: JSON.parse(binding.bindingInfoJson()), cases: {} }
    for (const fallback of [false, true]) {
      const source = `@utilities{${Array.from({ length: count }, (_, i) => `u${i}{display:block;${fallback ? 'display:made-up-value;' : ''}}`).join('')}}`
      const compiled = compile(source)
      const manifest = JSON.stringify(compiled.manifest)
      const classes = Array.from({ length: count }, (_, i) => `u${i}`)
      const generate = () => {
        const engine = new binding.EngineSession(manifest)
        try { engine.ensureClassRules(classes); return JSON.parse(engine.snapshot()) }
        finally { engine.dispose() }
      }
      const snapshot = generate()
      const nodes = snapshot.rules.flatMap(rule => rule.nodes?.map(node => node.text) || [rule.text])
      const cssom = await page.evaluate(nodes => {
        const insertion = [], deletion = []
        for (let run = 0; run < 12; run++) {
          const sheet = new CSSStyleSheet()
          sheet.insertRule('@layer utilities{}')
          const layer = sheet.cssRules[0]
          const start = performance.now()
          for (const text of nodes) layer.insertRule(text, layer.cssRules.length)
          const inserted = performance.now()
          while (layer.cssRules.length) layer.deleteRule(layer.cssRules.length - 1)
          const deleted = performance.now()
          if (run >= 3) { insertion.push(inserted - start); deletion.push(deleted - inserted) }
        }
        const median = values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]
        return { insertMedianMs: median(insertion), deleteMedianMs: median(deletion) }
      }, nodes)
      results[label].cases[fallback ? 'fallbacks' : 'single'] = {
        utilities: count, manifest: bytes(manifest), css: bytes(snapshot.text), cssomNodes: nodes.length,
        compileMedianMs: measure(() => compile(source)), engineMedianMs: measure(generate), cssom
      }
    }
    results[label].counterexamples = Object.fromEntries([
      ['fallback', '.a{@compose color:red;display:block;display:made-up-value}'],
      ['padding', '.a{@compose color:red;padding-left:20px;padding:10px;padding-left:30px}'],
      ['statements', '.a{@compose color:red;@compose color:blue;}']
    ].map(([name, source]) => [name, compile(source).css]))
    results[label].computedStyles = {}
    for (const [name, css] of Object.entries(results[label].counterexamples)) {
      await page.setContent(`<style>${css}</style><span class="a">Example</span>`)
      results[label].computedStyles[name] = await page.locator('.a').evaluate(element => {
        const style = getComputedStyle(element)
        return { display: style.display, paddingLeft: style.paddingLeft, color: style.color }
      })
    }
    results[label].representativeManifest = compile('@utilities{fallback{display:block;display:made-up-value;padding-left:20px;padding:10px;padding-left:30px}}').manifest
  }
  results.artifacts = Object.fromEntries([
    'packages/preset/src/default-manifest.json', 'packages/runtime/dist/global.min.js',
    'packages/runtime/dist/default-manifest.json', 'packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm'
  ].map(path => {
    const size = buffer => ({ raw: buffer.byteLength, gzip9: gzipSync(buffer, { level: 9 }).byteLength, brotli: brotliCompressSync(buffer).byteLength })
    return [path, {
      current: size(readFileSync(`${root}${path}`)),
      ...(baselineArtifacts ? { baseline: size(readFileSync(join(baselineArtifacts, basename(path)))) } : {})
    }]
  }))
  results.environment = { node: process.version, platform: `${process.platform}/${process.arch}`, browser: browser.version(), samples: 9, warmups: 3, gzipLevel: 6, bindingProfile: 'release (caller must build both bindings with --release)' }
  const json = `${JSON.stringify(results, null, 2)}\n`
  if (option('--output')) writeFileSync(option('--output'), json)
  else process.stdout.write(json)
} finally { await browser.close() }
