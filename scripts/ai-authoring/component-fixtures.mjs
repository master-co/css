import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { compile } from '@tailwindcss/node'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'
import { compileRenderedStylesheet } from '@master/css-compiler/stylesheet'
import { createRenderSessionSync } from '@master/css/node'
import { createToolingSessionSync, validateRuleDeclarations } from '@master/css-tooling/node'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { projectStyleExamples } from '../../site/components/demo/project-style-examples.ts'
import { getStaticFixtureSource } from '../../benchmarks/fixtures/static.ts'

export const classNames = html => [...new Set([...html.matchAll(/class="([^"]*)"/g)].flatMap(m => m[1].split(/\s+/)).filter(Boolean))]

export async function project(root, source, repository) {
  await mkdir(root)
  await symlink(join(repository, 'node_modules'), join(root, 'node_modules'), 'dir')
  await writeFile(join(root, 'package.json'), '{"name":"component-smoke","private":true,"type":"module"}')
  await writeFile(join(root, 'app.css'), source)
  const compiled = await compileRenderedStylesheet(join(root, 'app.css'), source, {
    projectDir: root, baseManifest: preset, preserveNativeCSS: true,
    delivery: {
      entryURL: pathToFileURL(join(root, 'built.css')).href,
      stylesheetURL: (file, variant = '') => pathToFileURL(join(root, `${createHash('sha256').update(file + variant).digest('hex').slice(0, 16)}.css`)).href,
      resourceURL: file => pathToFileURL(file).href
    }
  })
  assert.deepEqual(compiled.diagnostics.filter(d => d.severity === 'error'), [])
  for (const asset of compiled.stylesheets ?? []) await writeFile(fileURLToPath(asset.href), asset.css)
  return compiled
}

export function render(manifest, html, nativeNames = []) {
  using tooling = createToolingSessionSync({ manifest })
  const classes = classNames(html).filter(name => !nativeNames.includes(name))
  const checks = classes.map(className => tooling.inspectClassName(className))
  for (const check of checks) {
    assert.equal(check.matchStatus, 'matched', check.className)
    assert.notEqual(check.cssSyntaxStatus, 'invalid', check.className)
    assert.notEqual(check.cssValueStatus, 'invalid', check.className)
  }
  using engine = createRenderSessionSync({ manifest })
  return { css: engine.ensureClassRules(classes).cssText, checks }
}

export async function masterFixture(compiled, suggest) {
  const before = projectStyleExamples.checkedSelector.html
  assert.ok(before.includes('p-md') && before.includes('gap-sm'))
  const report = await suggest('padding:var(--spacing-sm);gap:var(--spacing-xs)')
  assert.equal(report.status, 'suggested')
  assert.equal(report.remainingCss, '')
  const padding = report.declarations.find(d => d.property === 'padding').className
  const gap = report.declarations.find(d => d.property === 'gap').className
  const after = before.replace('p-md', padding).replace('gap-sm', gap)
  assert.equal(before.replace(/class="[^"]*"/g, ''), after.replace(/class="[^"]*"/g, ''))
  const source = render(compiled.manifest, before)
  const target = render(compiled.manifest, after)
  return { id: 'master-density', source: { html: before, css: compiled.css + source.css },
    target: { html: after, css: compiled.css + target.css }, checks: [...source.checks, ...target.checks],
    provenance: 'site/components/demo/project-style-examples.ts#checkedSelector', report }
}

export async function tailwindFixture(compiled, suggest, repository) {
  const original = getStaticFixtureSource('dashboard').tailwindHtml.match(/<button class="[^"]*">Export<\/button>/)?.[0]
  assert.ok(original, 'Existing dashboard Export button is required')
  // Explicit pilot additions: the original benchmark button has no state variants.
  const states = 'hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed motion-reduce:transition-none transition-colors'
  const html = original.replace('class="', `type="button" class="${states} `)
  const candidates = classNames(html)
  const compiler = await compile('@import "tailwindcss";', { base: repository, onDependency() {} })
  const sourceCSS = compiler.build(candidates)
  const { mappings, reports, retained, retainedNames, retainedCSS, layerOrder } = await convertTailwindRules(sourceCSS, candidates, suggest)
  const targetHTML = html.replace(/class="[^"]*"/, `class="${candidates.flatMap(name => mappings.get(name) ?? [retainedNames.get(name)]).join(' ')}"`)
  const generated = render(compiled.manifest, targetHTML, [...retainedNames.values()])
  const version = JSON.parse(await readFile(join(repository, 'node_modules/tailwindcss/package.json'), 'utf8')).version
  return { id: 'tailwind-export', source: { html, css: sourceCSS }, target: { html: targetHTML, css: layerOrder + generated.css + retainedCSS },
    checks: generated.checks, reports, retainedCSS, converted: [...mappings.keys()], retained,
    provenance: 'benchmarks/fixtures/static.ts#dashboard.tailwindHtml Export button',
    additions: states.split(' '), tailwindVersion: version }
}

// Declarations as the CSS generator writes them, without optional whitespace.
function declarationText(node) {
  if (node.type !== 'decl') return node.toString()
  const [declaration] = validateRuleDeclarations(`a{${node.prop}:${node.value}}`)
  return `${node.prop}:${declaration?.value ?? node.value}${node.important ? '!important' : ''}`
}

// Converts each single-class Tailwind rule that Rust can suggest, and renames the classes of every retained rule.
export async function convertTailwindRules(sourceCSS, candidates, suggest) {
  const root = postcss.parse(sourceCSS)
  const simpleRules = new Map()
  root.walkRules(rule => {
    const selectors = selectorParser().astSync(rule.selector).nodes
    if (selectors.length !== 1) return
    const parts = selectors[0].nodes
    if (parts.length !== 1 || parts[0].type !== 'class') return
    const name = parts[0].value
    if (candidates.includes(name) && !name.includes(':')) simpleRules.set(name, rule)
  })
  const mappings = new Map()
  const reports = []
  for (const [name, rule] of simpleRules) {
    // Read the actual compiled declaration block; Rust decides whether to suggest or preserve.
    const report = await suggest(rule.nodes.map(declarationText).join(';'))
    reports.push({ sourceClass: name, ...report })
    if (report.status === 'suggested') mappings.set(name, report.classes)
  }
  assert.ok(mappings.size > 0, 'The bridge must convert at least one actual utility')
  const retained = candidates.filter(name => !mappings.has(name))
  const retainedNames = new Map(retained.map((name, index) => [name, `imported-state-${index}`]))
  // This is a fixture adapter, not a stylesheet converter: retain all unconverted
  // rules, wrappers, theme/reset dependencies and @property registrations.
  for (const name of mappings.keys()) simpleRules.get(name).remove()
  const rename = selectorParser(selectors => selectors.walkClasses(node => {
    const replacement = retainedNames.get(node.value)
    if (replacement) node.value = replacement
  }))
  root.walkRules(rule => { rule.selector = rename.processSync(rule.selector) })
  // Retained source globals follow generated globals so Tailwind token values
  // remain authoritative, even where both systems have a token with the same name.
  const retainedCSS = root.toString()
  const layerOrder = root.nodes.filter(node => node.type === 'atrule' && node.name === 'layer' && !node.nodes).map(node => `${node};`).join('')
  return { mappings, reports, retained, retainedNames, retainedCSS, layerOrder }
}
