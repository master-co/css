import assert from 'node:assert/strict'
import { createRequire, SourceMap } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const packageDir = process.env.BH_NEXT_PACKAGE_DIR
const require = createRequire(join(packageDir, 'package.json'))
const { compileStylesheet } = await import(pathToFileURL(require.resolve('@master/css-compiler/stylesheet')))
const nextRequire = createRequire(require.resolve('next/package.json'))
const { CssMinimizerPlugin } = nextRequire('next/dist/build/webpack/plugins/css-minimizer-plugin')
const minimizer = new CssMinimizerPlugin({ postcssOptions: { map: { inline: false, annotation: false, sourcesContent: true } } })
const baseManifest = { version: 1, utilities: [] }
const cases = [
  { name: 'separate-mergeable', css: '.shared{display:block}.sibling{display:block}', selectors: ['.shared', '.sibling'] },
  { name: 'authored-list', css: '.shared,.sibling{display:block}', selectors: ['.shared', '.sibling'] },
  { name: 'nested-mergeable', css: '@media screen{.shared{display:block}.sibling{display:block}}', selectors: ['.shared', '.sibling'] },
  { name: 'distinct-declarations', css: '.shared{display:block}.sibling{margin:1px}', selectors: ['.shared', '.sibling'] },
  { name: 'unicode-lines', css: '/* 🧪 */\n.shared{display:block}\n.sibling{display:block}', selectors: ['.shared', '.sibling'] }
]
const results = []
function inspect(css, payload, source, selectors) {
  const map = new SourceMap(payload)
  return selectors.map(selector => {
    const outputOffset = css.indexOf(selector), authoredOffset = source.indexOf(selector)
    assert(outputOffset >= 0 && authoredOffset >= 0, `Retained selector ${selector}`)
    const out = css.slice(0, outputOffset).split('\n'), original = source.slice(0, authoredOffset).split('\n')
    const actual = map.findEntry(out.length - 1, out.at(-1).length)
    const expected = { line: original.length - 1, column: original.at(-1).length }
    return { selector, actual, expected, pass: actual.originalLine === expected.line && actual.originalColumn === expected.column && payload.sourcesContent?.includes(source) }
  })
}
for (const item of cases) {
  for (const preserveNativeSource of [false, true]) {
    const filename = '/audit/' + item.name + '.css'
    const compiled = await compileStylesheet(filename, item.css, { baseManifest, preserveNativeSource })
    const payload = JSON.parse(compiled.sourceMap)
    const optimized = await minimizer.optimizeAsset(filename, {
      source: () => compiled.css,
      sourceAndMap: () => ({ source: compiled.css, map: payload })
    })
    const final = optimized.sourceAndMap()
    results.push({ name: item.name, preserveNativeSource, source: item.css,
      compiler: { css: compiled.css, map: payload, checks: inspect(compiled.css, payload, item.css, item.selectors) },
      nextOptimizer: { css: final.source, map: final.map, checks: inspect(final.source, final.map, item.css, item.selectors) } })
  }
}
const pureEvidence = process.env.BH_NEXT_PURE_HOST_EVIDENCE
const result = {
  scope: 'Direct public compiler output followed by actual installed Next CssMinimizerPlugin.optimizeAsset; no replacement optimizer or source matching repair',
  compilerPackage: require.resolve('@master/css-compiler/stylesheet'),
  bindingOverride: process.env.MASTER_CSS_NATIVE_BINDING_PATH,
  minimizer: nextRequire.resolve('next/dist/build/webpack/plugins/css-minimizer-plugin'),
  results,
  ...(pureEvidence ? { pureHost: JSON.parse(readFileSync(pureEvidence, 'utf8')).scenario } : {})
}
assert(results.filter(row => row.preserveNativeSource).every(row => row.compiler.checks.every(check => check.pass)), 'Copied source map must preserve every fixture anchor before optimization')
writeFileSync(process.env.BH_NEXT_STAGE_EVIDENCE, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(results.map(row => ({ name: row.name, preserveNativeSource: row.preserveNativeSource, compiler: row.compiler.checks.map(check => check.pass), nextOptimizer: row.nextOptimizer.checks.map(check => check.pass) })), null, 2))
