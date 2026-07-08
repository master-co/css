import propertiesJSON from 'mdn-data/css/properties.json' with { type: 'json' }
import selectorsJSON from 'mdn-data/css/selectors.json' with { type: 'json' }
import syntaxesJSON from 'mdn-data/css/syntaxes.json' with { type: 'json' }

interface MDNCSSSyntaxData {
  syntax?: string
}

interface MDNCSSData {
  properties: Record<string, MDNCSSSyntaxData>
  selectors: Record<string, MDNCSSSyntaxData>
  syntaxes: Record<string, MDNCSSSyntaxData>
}

const mdnCSSData: MDNCSSData = {
  properties: propertiesJSON as Record<string, MDNCSSSyntaxData>,
  selectors: selectorsJSON as Record<string, MDNCSSSyntaxData>,
  syntaxes: syntaxesJSON as Record<string, MDNCSSSyntaxData>
}

const PAGE_PSEUDO_CLASS_NAMES = new Set([':first', ':left', ':right', ':blank'])
const LOCAL_PSEUDO_CLASS_NAMES = [':nth']
const REFERENCE_RE = /<('([^']+)'|([a-zA-Z][\w-]*)(?:\s+[^>]*)?)>/g
const TOKEN_RE = /-?[a-zA-Z_][\w-]*/g
const VENDOR_PREFIX_RE = /^-(?:webkit|moz|ms)-/
const NON_KEYWORD_TOKENS = new Set([
  '∞',
  'n',
  'of'
])

function unique(values: Iterable<string>) {
  return [...new Set(values)]
}

export function getMdnPropertySyntax(name: string | undefined) {
  if (!name) return
  const exactSyntax = mdnCSSData.properties[name]?.syntax
  if (exactSyntax) return exactSyntax
  if (VENDOR_PREFIX_RE.test(name)) {
    return mdnCSSData.properties[name.replace(VENDOR_PREFIX_RE, '')]?.syntax
  }
}

function getSyntaxByReference(name: string) {
  return mdnCSSData.properties[name]?.syntax || mdnCSSData.syntaxes[name]?.syntax
}

function collectSyntaxKeywordValues(syntax: string | undefined, seen = new Set<string>()): string[] {
  if (!syntax) return []
  const values: string[] = []
  let syntaxWithoutReferences = syntax

  for (const match of syntax.matchAll(REFERENCE_RE)) {
    const referenceName = match[2] || match[3]
    if (!referenceName || seen.has(referenceName)) continue
    seen.add(referenceName)
    values.push(...collectSyntaxKeywordValues(getSyntaxByReference(referenceName), seen))
    syntaxWithoutReferences = syntaxWithoutReferences.replace(match[0], ' ')
  }

  for (const match of syntaxWithoutReferences.matchAll(TOKEN_RE)) {
    const value = match[0]
    if (NON_KEYWORD_TOKENS.has(value) || /^-?\d/.test(value)) continue
    values.push(value)
  }

  return unique(values)
}

export function getMdnPropertyValueNames(name: string | undefined) {
  return unique(collectSyntaxKeywordValues(getMdnPropertySyntax(name)))
}

export function getMdnPseudoClassNames() {
  return unique([
    ...Object.keys(mdnCSSData.selectors)
      .filter((name) => name.startsWith(':') && !name.startsWith('::') && !PAGE_PSEUDO_CLASS_NAMES.has(name)),
    ...LOCAL_PSEUDO_CLASS_NAMES
  ])
}

export function getMdnPseudoElementNames() {
  return Object.keys(mdnCSSData.selectors)
    .filter((name) => name.startsWith('::'))
}
