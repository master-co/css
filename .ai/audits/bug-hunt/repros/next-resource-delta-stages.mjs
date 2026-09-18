import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const { compileRenderedStylesheet } = await import(pathToFileURL(join(process.env.BH_COMPILER_PACKAGE_DIR, 'dist/stylesheet/index-public.js')))
const nextRequire = createRequire(createRequire(join(process.env.BH_NEXT_PACKAGE_DIR, 'package.json')).resolve('next/package.json'))
const postcss = nextRequire('postcss')
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const baseManifest = { version: 1, utilities: [] }
const source = '@theme{--color-old:#111111;--color-late:#abcdef}.card{color:var(--color-old)}'
const initial = await compileRenderedStylesheet('/audit/entry.css', source, { baseManifest })
let onceCalls = 0
const lateVisits = []
const plugins = [{ postcssPlugin: 'audit-once-resource-edit', Once(root) {
  onceCalls++
  root.walkDecls('--color-old', decl => { decl.value = '#123456' })
  root.walkDecls('--color-late', decl => { lateVisits.push(onceCalls);decl.value = '#fedcba' })
  root.walkRules(rule => { if (rule.selector === '.card') rule.append({ prop: 'background-color', value: 'var(--color-late)' }) })
  root.append(postcss.rule({ selector: '.once-' + onceCalls, nodes: [postcss.decl({ prop: 'display', value: 'block' })] }))
} }]
const processed = await postcss(plugins).process(initial.css, { from: '/audit/entry.css', map: false })
assert.equal(onceCalls, 1)
assert.deepEqual(lateVisits, [])
const withoutContext = await compileRenderedStylesheet('/audit/entry.css', processed.css, { baseManifest: initial.manifest })
const withContext = await compileRenderedStylesheet('/audit/entry.css', processed.css, { baseManifest: initial.manifest, emittedGlobals: initial.emittedGlobals })
assert(withContext.generatedCSS.includes('--color-late:#abcdef'))
assert(!withContext.generatedCSS.includes('--color-old:'))
assert(withoutContext.generatedCSS.includes('--color-old:'))
const secondPass = await postcss(plugins).process(withContext.css, { from: '/audit/entry.css', map: false })
assert.equal(onceCalls, 2)
assert.deepEqual(lateVisits, [2])
assert(secondPass.css.includes('.once-1') && secondPass.css.includes('.once-2'))
const cases = [
  { name: 'without-context', css: withoutContext.css, userPasses: 1 },
  { name: 'with-context', css: withContext.css, userPasses: 1 },
  { name: 'second-whole-pass', css: secondPass.css, userPasses: 2 }
]
const observations = [], errors = []
for (const name of ['chromium', 'webkit']) {
  const browser = await browsers[name].launch({ headless: true })
  try {
    const page = await browser.newPage()
    for (const item of cases) {
      await page.setContent('<!doctype html><style>' + item.css + '</style><div class="card">Probe</div>')
      const computed = await page.locator('.card').evaluate(node => {
        const style = getComputedStyle(node)
        return { color: style.color, background: style.backgroundColor }
      })
      observations.push({ browser: name, case: item.name, computed,
        preservesExistingEdit: computed.color === 'rgb(18, 52, 86)',
        processesNewGlobal: computed.background === 'rgb(254, 220, 186)',
        singleUserPass: item.userPasses === 1 })
    }
  } catch (error) { errors.push({ browser: name, error: String(error) }) }
  finally { await browser.close() }
}
assert(observations.filter(row => row.case === 'with-context').every(row => row.preservesExistingEdit && !row.processesNewGlobal && row.singleUserPass))
const result = { source, initial: { css: initial.css, emittedGlobals: initial.emittedGlobals }, processed: processed.css,
  withContext: { generatedCSS: withContext.generatedCSS, emittedGlobals: withContext.emittedGlobals }, cases, onceCalls, lateVisits, observations, errors,
  scope: 'Actual Next PostCSS plus compiler resource context and two browser controls. Delta emission is verified; full arbitrary-plugin closure is deliberately not claimed.' }
writeFileSync(process.env.BH_NEXT_STAGE_EVIDENCE, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ onceCalls, lateVisits, observations, errors }, null, 2))
process.exitCode = errors.length || observations.length !== 6 ? 1 : 0
