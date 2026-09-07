import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const require = createRequire(new URL('../packages/tooling/package.json', import.meta.url))
const outputPath = path.resolve('crates/mastercss-language/src/mdn-completion-registry.json')
const properties = JSON.parse(readFileSync(require.resolve('mdn-data/css/properties.json'), 'utf8'))
const selectors = JSON.parse(readFileSync(require.resolve('mdn-data/css/selectors.json'), 'utf8'))
const syntaxes = JSON.parse(readFileSync(require.resolve('mdn-data/css/syntaxes.json'), 'utf8'))

const pagePseudoClasses = new Set([':first', ':left', ':right', ':blank'])
const functionalPseudoClasses = new Set([
  ':current',
  ':dir',
  ':has',
  ':has-slotted',
  ':host',
  ':host-context',
  ':is',
  ':lang',
  ':local-link',
  ':not',
  ':nth-child',
  ':nth-col',
  ':nth-last-child',
  ':nth-last-col',
  ':nth-last-of-type',
  ':nth-of-type',
  ':of',
  ':state',
  ':where'
])
const referenceRE = /<('([^']+)'|([a-zA-Z][\w-]*(?:\(\))?)(?:\s+[^>]*)?)>/g
const tokenRE = /-?[a-zA-Z_][\w-]*/g
const nonKeywordTokens = new Set(['∞', 'n', 'of'])

function unique(values) {
  return [...new Set(values)]
}

function syntaxByReference(name) {
  return properties[name]?.syntax || syntaxes[name]?.syntax
}

function collectSyntaxValues(syntax, seen = new Set()) {
  if (!syntax) return []
  const values = []
  let source = syntax
  for (const match of syntax.matchAll(referenceRE)) {
    const name = match[2] || match[3]
    if (!name || seen.has(name)) continue
    seen.add(name)
    if (name.endsWith('()')) {
      values.push({ label: name, kind: 'function' })
    } else {
      values.push(...collectSyntaxValues(syntaxByReference(name), seen))
    }
    source = source.replace(match[0], ' ')
  }
  for (const match of source.matchAll(tokenRE)) {
    const value = match[0]
    if (nonKeywordTokens.has(value) || /^-?\d/u.test(value)) continue
    values.push({ label: value, kind: 'value' })
  }
  return [...new Map(values
    .filter(({ label }) => !label.includes(' '))
    .map((value) => [value.label, value])).values()]
}

function normalizePseudo(label) {
  if (label.startsWith('::')) {
    return /::(?:part|slotted)$/u.test(label) ? `${label}()` : label
  }
  const base = label.endsWith('()') ? label.slice(0, -2) : label
  return functionalPseudoClasses.has(base) ? `${base}()` : label
}

const registry = {
  pseudos: unique([...Object.keys(selectors)
    .filter((name) => (name.startsWith('::') || name.startsWith(':')) && !pagePseudoClasses.has(name))
    .map(normalizePseudo), ':of()'])
    .sort(),
  properties: Object.fromEntries(Object.entries(properties)
    .map(([name, value]) => [name, collectSyntaxValues(value.syntax)])
    .filter(([, values]) => values.length)
    .sort(([left], [right]) => left.localeCompare(right)))
}
const content = `${JSON.stringify(registry)}\n`

if (process.argv.includes('--check')) {
  assert.equal(readFileSync(outputPath, 'utf8'), content, `${path.relative(process.cwd(), outputPath)} is stale.`)
  console.log(`Validated ${path.relative(process.cwd(), outputPath)}.`)
} else {
  writeFileSync(outputPath, content)
  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}.`)
}
