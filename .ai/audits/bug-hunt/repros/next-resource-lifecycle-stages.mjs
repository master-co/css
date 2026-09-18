import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const compilerDirectory = process.env.BH_COMPILER_PACKAGE_DIR
const { compileRenderedStylesheet } = await import(pathToFileURL(join(compilerDirectory, 'dist/stylesheet/index-public.js')))
const nextRequire = createRequire(createRequire(join(process.env.BH_NEXT_PACKAGE_DIR, 'package.json')).resolve('next/package.json'))
const postcss = nextRequire('postcss')
const baseManifest = { version: 1, utilities: [] }
const source = '@theme{--color-old:#111111;--color-late:#abcdef}.card{color:var(--color-old);audit-trigger:1}'
const initial = await compileRenderedStylesheet('/audit/entry.css', source, { baseManifest })
const phases = ['Once', 'Declaration', 'OnceExit']
const rows = []
const errors = []

function propertyValues(root, prop) {
  const values = []
  root.walkDecls(prop, declaration => values.push(declaration.value))
  return values
}

for (const strategy of ['tail-hooks', 'after-user-hooks', 'pure-postcss'])
for (const introductionPhase of phases) for (const processingPhase of phases) {
  const events = []
  let introduced = false, userOnce = 0, closureCalls = 0
  let emittedGlobals = initial.emittedGlobals
  function introduce(root) {
    if (introduced) return
    introduced = true
    root.walkRules('.card', rule => rule.append({ prop: 'background-color', value: 'var(--color-late)' }))
    events.push('introduce:' + introductionPhase)
    if (strategy === 'pure-postcss') {
      // Equivalent ordinary CSS: producer adds both reference and its definition.
      root.append(postcss.parse('@layer theme{:root{--color-late:#abcdef}}').nodes)
    }
  }
  function processDeclaration(declaration) {
    if (declaration.prop === '--color-late' && declaration.value !== '#fedcba') {
      declaration.value = '#fedcba'
      events.push('process:' + processingPhase)
    }
  }
  const introducer = { postcssPlugin: 'audit-introduce-resource' }
  introducer[introductionPhase] = introductionPhase === 'Declaration'
    ? declaration => { if (declaration.prop === 'audit-trigger') introduce(declaration.root()) }
    : introduce
  const processor = { postcssPlugin: 'audit-process-resource', Once(root) {
    userOnce++
    root.walkDecls('--color-old', declaration => { declaration.value = '#123456' })
    root.append({ selector: '.once-' + userOnce, nodes: [{ prop: 'display', value: 'block' }] })
    if (processingPhase === 'Once') root.walkDecls(processDeclaration)
  } }
  if (processingPhase === 'Declaration') processor.Declaration = processDeclaration
  if (processingPhase === 'OnceExit') processor.OnceExit = root => root.walkDecls(processDeclaration)
  async function closeResources(root, stage) {
    assert(++closureCalls <= 12, 'resource hook must converge')
    const result = await compileRenderedStylesheet('/audit/entry.css', root.toString(), {
      baseManifest: initial.manifest, emittedGlobals
    })
    emittedGlobals = result.emittedGlobals
    if (result.generatedCSS) {
      events.push('emit:' + stage)
      root.append(postcss.parse(result.generatedCSS, { from: '/audit/generated.css' }).nodes)
    }
  }
  // Probe native lifecycle only: no callback wrapping, plugin replay or manual traversal.
  const bridge = { postcssPlugin: 'audit-resource-bridge',
    Once: root => closeResources(root, 'Once'),
    RootExit: root => closeResources(root, 'RootExit'),
    OnceExit: root => closeResources(root, 'OnceExit') }
  function wrapRootHooks(plugin) {
    const wrapped = { ...plugin }
    for (const hook of ['Once', 'OnceExit']) {
      if (!plugin[hook]) continue
      wrapped[hook] = async function (root, helpers) {
        await plugin[hook].call(this, root, helpers)
        await closeResources(root, plugin.postcssPlugin + ':' + hook)
      }
    }
    return wrapped
  }
  // Bounded probe: these fixtures are plain plugin objects with no prepare/Document hooks.
  // This wrapper is not a production dispatcher or a promise of arbitrary-plugin parity.
  const plugins = strategy === 'pure-postcss' ? [introducer, processor]
    : strategy === 'after-user-hooks' ? [wrapRootHooks(introducer), wrapRootHooks(processor), bridge]
      : [introducer, processor, bridge]
  const result = await postcss(plugins).process(initial.css, { from: '/audit/entry.css', map: false })
  const old = propertyValues(result.root, '--color-old')
  const late = propertyValues(result.root, '--color-late')
  const expectedProcessed = strategy === 'tail-hooks'
    ? introductionPhase !== 'OnceExit' && processingPhase !== 'Once'
    : phases.indexOf(processingPhase) >= phases.indexOf(introductionPhase)
  assert.equal(userOnce, 1)
  assert.deepEqual(old, ['#123456'])
  assert.deepEqual(late, [expectedProcessed ? '#fedcba' : '#abcdef'])
  rows.push({ strategy, introductionPhase, processingPhase, old, late, userOnce, closureCalls, events,
    processed: late[0] === '#fedcba', css: result.css })
}

for (const row of rows.filter(row => row.strategy === 'after-user-hooks')) {
  const pure = rows.find(other => other.strategy === 'pure-postcss' && other.introductionPhase === row.introductionPhase && other.processingPhase === row.processingPhase)
  assert.equal(row.processed, pure.processed)
  assert.deepEqual(row.late, pure.late)
}

const contextRows = []
for (const mutation of ['remove', 'rename']) {
  const root = postcss.parse(initial.css)
  root.walkDecls('--color-old', declaration => {
    if (mutation === 'remove') declaration.remove()
    else declaration.prop = '--color-renamed'
  })
  const retained = await compileRenderedStylesheet('/audit/entry.css', root.toString(), {
    baseManifest: initial.manifest, emittedGlobals: initial.emittedGlobals
  })
  const corrected = await compileRenderedStylesheet('/audit/entry.css', root.toString(), {
    baseManifest: initial.manifest,
    // Known fixture mutation only. This is not a generic ownership detector.
    emittedGlobals: { variables: { 'color-old': 0 }, animations: {} }
  })
  assert(!retained.generatedCSS.includes('--color-old:'))
  assert(corrected.generatedCSS.includes('--color-old:'))
  contextRows.push({ mutation, staleContextCSS: retained.css, correctedContextCSS: corrected.css,
    staleSuppressesRequiredResource: true, correctedEmitsResource: true })
}

// Browser checks cover every lifecycle cell and both context outcomes.
const playwright = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const observations = []
for (const name of ['chromium', 'webkit']) {
  const browser = await playwright[name].launch({ headless: true })
  try {
    const page = await browser.newPage()
    const controls = rows.map(row => ({ name: row.strategy + '/' + row.introductionPhase + '/' + row.processingPhase,
      css: row.css, color: 'rgb(18, 52, 86)', background: row.processed ? 'rgb(254, 220, 186)' : 'rgb(171, 205, 239)' }))
    for (const row of contextRows) {
      controls.push({ name: row.mutation + '/stale', css: row.staleContextCSS, color: 'rgb(0, 128, 0)' })
      controls.push({ name: row.mutation + '/corrected', css: row.correctedContextCSS, color: 'rgb(17, 17, 17)' })
    }
    for (const control of controls) {
      await page.setContent('<!doctype html><style>body{color:green}' + control.css + '</style><div class="card">Probe</div>')
      const computed = await page.locator('.card').evaluate(node => {
        const style = getComputedStyle(node)
        return { color: style.color, background: style.backgroundColor }
      })
      assert.equal(computed.color, control.color, name + ':' + control.name)
      if (control.background) assert.equal(computed.background, control.background, name + ':' + control.name)
      observations.push({ browser: name, case: control.name, computed })
    }
  } catch (error) { errors.push({ browser: name, error: String(error) }) }
  finally { await browser.close() }
}
const lazyResultPath = nextRequire.resolve('postcss/lib/lazy-result')
const report = { scope: 'Bounded native PostCSS lifecycle and stale-context controls, not an integrated Next solution or arbitrary-plugin guarantee.',
  compilerDirectory, postcssVersion: postcss().version,
  lazyResultPath, lazyResultSha256: createHash('sha256').update(readFileSync(lazyResultPath)).digest('hex'),
  initial: { css: initial.css, emittedGlobals: initial.emittedGlobals }, rows, contextRows, observations, errors }
writeFileSync(process.env.BH_NEXT_STAGE_EVIDENCE, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ matrix: rows.map(({ strategy, introductionPhase, processingPhase, processed, events }) => ({ strategy, introductionPhase, processingPhase, processed, events })), contextRows: contextRows.length, observations: observations.length, errors }, null, 2))
process.exitCode = errors.length || observations.length !== 62 ? 1 : 0
