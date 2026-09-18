import { createRequire, SourceMap } from 'node:module'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
const require = createRequire(new URL('../../../../packages/compiler/package.json', import.meta.url))
const { createCompilerBindingSessionSync } = await import(pathToFileURL(require.resolve('@master/css-binding/compiler/node')))
const { defaultBuildManifest } = await import(pathToFileURL(require.resolve('@master/css-internal/project')))
const { compileRenderedStylesheet } = await import(pathToFileURL(require.resolve('@master/css-compiler/stylesheet')))
const packageDir = process.env.BH_NEXT_PACKAGE_DIR
const nextRequire = packageDir ? createRequire(join(packageDir, 'package.json')) : undefined
const postcss = nextRequire ? createRequire(nextRequire.resolve('next/package.json'))('postcss') : undefined
const prepareNextModule = packageDir ? (await import(pathToFileURL(join(packageDir, 'dist/prepare-module.js')))).prepareNextModule : undefined
const browsers = packageDir ? createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test') : undefined
const root = mkdtempSync(join(tmpdir(), 'next-lowering-stages-'))
const cases = {
  compose: { source: '@master entry;\n@preserve native;\n.direct {\n  @compose p:2rem;\n  color:#123456;\n  border-top:7px solid red;\n}' },
  exports: { source: '@master entry;\n@preserve native;\n.original {\n  color:#123456;\n  border-top:7px solid red;\n}' },
  components: { source: '@master entry;\n@preserve native;\n@components{brand{border-top:7px solid red}}\n.direct{@compose brand;color:#123456}', classes: ['brand'] },
  shared: { source: '@master entry;@preserve native;@import "./child.module.css";.direct{composes:shared from "./child.module.css";color:#123456}', child: '.shared{@compose p:2rem;border-top:7px solid red}' }
}
const rows = []
try {
  for (const [name, fixture] of Object.entries(cases)) {
    const entry = join(root, name + '.module.css'), child = join(root, 'child.module.css')
    const files = { [entry]: fixture.source, ...(fixture.child ? { [child]: fixture.child } : {}) }
    for (const [file, source] of Object.entries(files)) writeFileSync(file, source)
    const graph = { entry, files, edges: fixture.child ? [{ from: entry, specifier: './child.module.css', resolved: child }] : [] }
    const session = createCompilerBindingSessionSync()
    try {
      const result = session.compileCSSStylesheetGraph({ graph, urls: Object.fromEntries(Object.keys(files).map((file, i) => [file, './' + i + '.css'])), resourceURLs: Object.fromEntries(Object.keys(files).map(file => [file, {}])), baseManifest: defaultBuildManifest, options: { preserveNativeCSS: true, ...(fixture.classes ? { classes: fixture.classes } : {}) } })
      const rendered = await compileRenderedStylesheet(entry, fixture.source, {
        baseManifest: defaultBuildManifest, projectDir: root, preserveNativeCSS: true, classes: fixture.classes,
        delivery: { entryURL: './0.css', stylesheetURL: file => file === entry ? './0.css' : './1.css', resourceURL: file => pathToFileURL(file).href }
      })
      const row = { name, source: fixture.source, child: fixture.child, classes: fixture.classes, resultKeys: Object.keys(result), directiveKeys: Object.keys(result.directives), stylesheets: result.stylesheets, rendered: { css: rendered.css, nativeCSS: rendered.nativeCSS, generatedCSS: rendered.generatedCSS, stylesheets: rendered.stylesheets } }
      rows.push(row)
      if (prepareNextModule && !fixture.child) {
        const lowered = result.stylesheets[0].css
        assert(!lowered.includes('@compose'))
        const plugin = { postcssPlugin: 'audit-stage-only', Rule(rule) { if (rule.selector === '.original') rule.selector = '.direct' }, Declaration(decl) { if (decl.prop === 'padding' && decl.value === '2rem') decl.value = '3rem' } }
        const previousMap = JSON.parse(rendered.stylesheets.find(asset => asset.id === entry).sourceMap)
        const processed = await postcss([plugin]).process(lowered, { from: entry, map: { prev: previousMap, inline: false, annotation: false, sourcesContent: true } })
        const module = await prepareNextModule({ resourcePath: entry, rootContext: root, context: root }, processed.css, root, processed.map.toString(), true, { scoped: true, resolveICSS: async () => { throw new Error('No imports allowed in single-file stage control') } })
        assert(module.exports.direct, 'PostCSS-derived direct export exists')
        const globalCSS = rendered.generatedCSS ? (await postcss([plugin]).process(rendered.generatedCSS, { from: entry, map: false })).css : ''
        const finalMap = JSON.parse(module.sourceMap)
        const scopedSelector = '.' + module.exports.direct.split(/\s+/)[0]
        const before = module.source.slice(0, module.source.indexOf(scopedSelector)).split('\n')
        const position = new SourceMap(finalMap).findEntry(before.length - 1, before.at(-1).length)
        const authoredSelector = name === 'exports' ? '.original' : '.direct'
        const authoredBefore = fixture.source.slice(0, fixture.source.indexOf(authoredSelector)).split('\n')
        const mapCheck = { position, expected: { file: pathToFileURL(entry).href, line: authoredBefore.length - 1, column: authoredBefore.at(-1).length }, fullSourcePreserved: finalMap.sourcesContent.includes(fixture.source) }
        assert.equal(position.originalSource, mapCheck.expected.file)
        assert.equal(position.originalLine, mapCheck.expected.line)
        assert.equal(position.originalColumn, mapCheck.expected.column)
        assert(mapCheck.fullSourcePreserved)
        const merged = globalCSS ? await prepareNextModule({ resourcePath: entry, rootContext: root, context: root }, processed.css + '\n' + globalCSS, root, undefined, true, { scoped: true, resolveICSS: async () => { throw new Error('No imports expected') } }) : undefined
        const observations = []
        const negativeControls = []
        for (const browserName of ['chromium', 'webkit']) {
          const browser = await browsers[browserName].launch({ headless: true, timeout: 15000 })
          try {
            const page = await browser.newPage()
            await page.setContent('<style>' + module.source + globalCSS + '</style><div id="probe" class="' + module.exports.direct + '">Stage</div><div id="global" class="brand">Global</div>')
            const actual = await page.locator('#probe').evaluate(el => { const style = getComputedStyle(el);return { color: style.color, border: style.borderTopWidth, padding: style.paddingTop } })
            const globalBorder = globalCSS ? await page.locator('#global').evaluate(el => getComputedStyle(el).borderTopWidth) : undefined
            observations.push({ browser: browserName, ...actual, globalBorder, pass: actual.color === 'rgb(18, 52, 86)' && actual.border === '7px' && (name !== 'compose' || actual.padding === '48px') && (!globalCSS || globalBorder === '7px') })
            if (merged) {
              await page.setContent('<style>' + merged.source + '</style><div id="global" class="brand">Global</div>')
              const border = await page.locator('#global').evaluate(el => getComputedStyle(el).borderTopWidth)
              negativeControls.push({ browser: browserName, border, exportedBrand: merged.exports.brand, expectedMisclassificationObserved: border === '0px' && Boolean(merged.exports.brand) })
            }
          } finally { await browser.close() }
        }
        row.stage = { lowered, postcss: processed.css, moduleCSS: module.source, globalCSS, exports: module.exports, observations, negativeControls, mapCheck, sourceMap: module.sourceMap, limitation: 'Single-file mechanism only; three selector map anchors and original content are checked. Global PostCSS is separate in this prototype; combined-root plugins, global maps, resources/import graphs and host lifecycle are not covered or repaired.' }
      }
    } catch (error) { rows.push({ name, error: String(error.stack || error) }) } finally { session.dispose() }
  }
} finally { rmSync(root, { recursive: true, force: true }) }
const report = { scope: 'Read-only native compiler boundary inspection, not a host fix or full parity claim', rows }
if (process.env.BH_NEXT_LOWERING_EVIDENCE) writeFileSync(process.env.BH_NEXT_LOWERING_EVIDENCE, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
process.exitCode = rows.some(row => row.error || row.stage?.observations.some(item => !item.pass) || row.stage?.negativeControls.some(item => !item.expectedMisclassificationObserved)) ? 1 : 0
