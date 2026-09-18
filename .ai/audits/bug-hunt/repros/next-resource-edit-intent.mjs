import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const nextDir = process.env.BH_NEXT_PACKAGE_DIR
const compilerDir = process.env.BH_COMPILER_PACKAGE_DIR
const { compileRenderedStylesheet } = await import(pathToFileURL(join(compilerDir, 'dist/stylesheet/index-public.js')))
const { createNextPostCSSResourceHook } = await import(pathToFileURL(join(nextDir, 'dist/postcss-resource-policy.js')))
const { createPostCSSRequestPlugins } = await import(pathToFileURL(join(nextDir, 'dist/postcss-request-plugins.js')))
const nextRequire = createRequire(createRequire(join(nextDir, 'package.json')).resolve('next/package.json'))
const postcss = nextRequire('postcss')
const playwright = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const source = '@theme{--color-old:#111111;--color-late:#abcdef}.card{color:var(--color-old)}'
const first = await compileRenderedStylesheet('/audit/entry.css', source, { baseManifest: { version: 1, utilities: [] } })
const cases = [], observations = [], errors = []
for (const mutation of ['delete', 'rename', 'rename-references', 'edit']) for (const master of [true, false]) {
  let calls = 0
  const plugins = [{ postcssPlugin: 'edit-old', Once(root) {
    calls++
    root.walkDecls(declaration => {
      if (declaration.prop === '--color-old') {
        if (mutation === 'delete') declaration.remove()
        else if (mutation === 'edit') declaration.value = '#123456'
        else declaration.prop = '--color-renamed'
      }
      if (mutation === 'rename-references' && declaration.value === 'var(--color-old)') declaration.value = 'var(--color-renamed)'
    })
    root.walkRules('.card', rule => rule.append({ prop: 'background-color', value: 'var(--color-late)' }))
  } }, { postcssPlugin: 'process-late', Once(root) {
    root.walkDecls('--color-late', declaration => { declaration.value = '#fedcba' })
  } }]
  const policy = { file: '/audit/entry.css', projectDir: '/audit', manifest: first.manifest, processedGlobals: first.emittedGlobals, resourceFiles: [] }
  const configured = master ? createPostCSSRequestPlugins(plugins, createNextPostCSSResourceHook(policy)) : plugins
  const result = await postcss(configured).process(first.css + (master ? '' : '@layer theme{:root{--color-late:#abcdef}}'), { from: policy.file })
  assert.equal(calls, 1)
  cases.push({ mutation, master, calls, css: result.css, processedHistory: result.root.masterCSSProcessedGlobals })
}
for (const name of ['chromium', 'webkit']) {
  const browser = await playwright[name].launch({ headless: true })
  try {
    const page = await browser.newPage()
    for (const item of cases) {
      await page.setContent('<!doctype html><style>body{color:green}' + item.css + '</style><div class="card">Probe</div>')
      const computed = await page.locator('.card').evaluate(node => {
        const style = getComputedStyle(node)
        return { color: style.color, background: style.backgroundColor }
      })
      const expected = item.mutation === 'edit' ? 'rgb(18, 52, 86)' : item.mutation === 'rename-references' ? 'rgb(17, 17, 17)' : 'rgb(0, 128, 0)'
      assert.equal(computed.color, expected)
      assert.equal(computed.background, 'rgb(254, 220, 186)')
      observations.push({ browser: name, mutation: item.mutation, master: item.master, computed })
    }
  } catch (error) { errors.push({ browser: name, error: String(error) }) }
  finally { await browser.close() }
}
const report = { source, cases, observations, errors,
  conclusion: 'Processing history preserves intentional user deletion/rename and matches plain PostCSS. Resetting history to current presence would resurrect deleted definitions. History is not a final CSS inventory or hydration count.' }
writeFileSync(process.env.BH_NEXT_STAGE_EVIDENCE, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ observations, errors }, null, 2))
process.exitCode = errors.length || observations.length !== 16 ? 1 : 0
