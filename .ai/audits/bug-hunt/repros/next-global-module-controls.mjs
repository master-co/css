import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'

const packageDir = process.env.BH_NEXT_PACKAGE_DIR
const require = createRequire(join(packageDir, 'package.json'))
const postcss = createRequire(require.resolve('next/package.json'))('postcss')
const { protectNextGeneratedGlobals } = await import(pathToFileURL(join(packageDir, 'dist/prepare-global-module.js')))
const { prepareNextModule } = await import(pathToFileURL(join(packageDir, 'dist/prepare-module.js')))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const file = '/audit/card.module.css'
const rows = []
for (const name of ['selectors', 'clone', 'move', 'class-collision', 'animation-collision']) {
  const source = '.direct{color:#123456;border-top:7px solid red}' + (name === 'class-collision' ? '.brand{padding:2px}' : '') + (name === 'animation-collision' ? '.fade{padding:2px}.direct{animation:fade 1s linear infinite}' : '')
  const generated = name === 'selectors' ? '.brand,.brand\\,x{color:#654321}' : '.brand{color:' + (name === 'clone' ? '#111111' : '#654321') + '}' + (name === 'animation-collision' ? '@keyframes fade{from{opacity:0.25}to{opacity:1}}' : '')
  const root = postcss.parse(source, { from: file })
  root.walk(node => { node.masterCSSGlobal = false })
  const globals = postcss.parse(generated, { from: file + '?master-css-generated' })
  globals.walk(node => { node.masterCSSGlobal = true })
  root.append(globals.nodes)
  let combinedRoot = false
  const processed = await postcss([{ postcssPlugin: 'audit-global-transform', Once(root) {
    const rules = []
    root.walkRules(rule => rules.push(rule))
    combinedRoot = rules.some(rule => rule.selector === '.direct') && rules.some(rule => rule.selector.includes('.brand'))
    if (name === 'clone') {
      const global = rules.find(rule => rule.masterCSSGlobal)
      const clone = global.clone()
      clone.walkDecls('color', decl => { decl.value = '#654321' })
      global.after(clone)
    }
    if (name === 'move') {
      for (const node of [...root.nodes].filter(node => node.masterCSSGlobal).reverse()) root.prepend(node.remove())
    }
  } }]).process(root, { from: file, to: file, map: { inline: false, annotation: false, sourcesContent: true } })
  const input = protectNextGeneratedGlobals(file, processed.root.toJSON(), true)
  const module = await prepareNextModule({ resourcePath: file, rootContext: '/audit', context: '/audit' }, input.source, '/audit', input.sourceMap, true, {
    scoped: true, globalAnimations: input.globalAnimations, async resolveICSS() { throw new Error('No ICSS imports expected') }
  })
  const row = { name, source, generated, combinedRoot, module, observations: [], pass: true }
  rows.push(row)
  try {
    assert(combinedRoot)
    assert(module.exports.direct && module.exports.direct !== 'direct')
    assert(!module.source.includes(':global('))
    if (name === 'class-collision') assert(module.exports.brand && module.exports.brand !== 'brand')
    else assert(!module.exports.brand)
    if (name === 'animation-collision') assert(module.exports.fade && module.exports.fade !== 'fade')
    if (name === 'move') assert(module.source.indexOf('.brand') < module.source.indexOf('.' + module.exports.direct))
    for (const browserName of ['chromium', 'webkit']) {
      const browser = await browsers[browserName].launch({ headless: true, timeout: 15000 })
      try {
        const page = await browser.newPage()
        await page.setContent('<style>' + module.source + '</style><div id="local" class="' + module.exports.direct + '">Local</div><div id="global" class="brand">Global</div><div id="escaped" class="brand,x">Escaped</div>')
        const actual = await page.evaluate(() => {
          const local = getComputedStyle(document.querySelector('#local'))
          return { color: local.color, border: local.borderTopWidth, animation: local.animationName, globalColor: getComputedStyle(document.querySelector('#global')).color, escaped: getComputedStyle(document.querySelector('#escaped')).color, animationCount: document.querySelector('#local').getAnimations().length }
        })
        const pass = actual.color === 'rgb(18, 52, 86)' && actual.border === '7px' && actual.globalColor === 'rgb(101, 67, 33)' && (name !== 'selectors' || actual.escaped === 'rgb(101, 67, 33)') && (name !== 'animation-collision' || actual.animation === 'fade' && actual.animationCount === 1)
        row.observations.push({ browser: browserName, ...actual, pass })
        assert(pass, JSON.stringify(actual))
      } finally { await browser.close() }
    }
  } catch (error) { row.pass = false;row.error = String(error.stack || error) }
}
writeFileSync(process.env.BH_NEXT_GLOBAL_EVIDENCE, JSON.stringify({ scope: 'Real Next Module processors on single post-PostCSS AST; not full graph/host coverage', rows }, null, 2) + '\n')
console.log(JSON.stringify(rows.map(row => ({ name: row.name, pass: row.pass, observations: row.observations, error: row.error }))))
process.exitCode = rows.every(row => row.pass) ? 0 : 1
