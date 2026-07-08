import type { MasterCSS } from '@master/css-engine'
import { inspectMasterCSSClass } from '@master/css-engine/inspect'
import { parseMasterCSSClassList } from '@master/css-lexer'
import UtilityType from '@master/css-schema/utility-type'
import {
  replaceClassGroupInClassList,
  replaceClassNameInClassList
} from './class-list-edits'
import suggestCanonicalClassGroups from './suggest-canonical-class-groups'
import suggestCanonicalClassName, {
  defaultCanonicalClassNameOptions,
  type CanonicalClassNameOptions
} from './suggest-canonical-class-name'

export interface CanonicalComposeDirectiveSuggestion {
  actual: string
  recommended: string
  classNames: string[]
  kind: 'class' | 'native-declaration' | 'variant-block'
}

export interface CanonicalComposeDirectiveResult {
  suggestions: CanonicalComposeDirectiveSuggestion[]
  structuralChange?: boolean
  replacement?: string
}

type ResolvedCanonicalClassNameOptions = Required<CanonicalClassNameOptions>

interface NativeDeclaration {
  property: string
  value: string
  important: boolean
}

interface ComposeBucket {
  classes: string[]
  declarations: NativeDeclaration[]
  variants: Map<string, ComposeBucket>
}

function resolveOptions(options: CanonicalClassNameOptions): ResolvedCanonicalClassNameOptions {
  return {
    ...defaultCanonicalClassNameOptions,
    ...options
  }
}

function createBucket(): ComposeBucket {
  return {
    classes: [],
    declarations: [],
    variants: new Map()
  }
}

function classValues(classList: string) {
  return parseMasterCSSClassList(classList)
    .filter((item) => item.type === 'class')
    .map((item) => item.token)
}

function canonicalizeClassList(
  classList: string,
  css: MasterCSS,
  options: ResolvedCanonicalClassNameOptions
) {
  const values = classValues(classList)
  const suggestions: CanonicalComposeDirectiveSuggestion[] = []
  const groupSuggestions = suggestCanonicalClassGroups(values, css, options)
  const coveredClassNames = new Set(groupSuggestions.flatMap((suggestion) => suggestion.classNames))
  let replacement = classList

  for (const suggestion of groupSuggestions) {
    replacement = replaceClassGroupInClassList(replacement, suggestion.classNames, suggestion.recommended)
    suggestions.push({
      actual: suggestion.classNames.join(' '),
      recommended: suggestion.recommended,
      classNames: suggestion.classNames,
      kind: 'class'
    })
  }

  for (const className of values) {
    if (coveredClassNames.has(className)) continue
    const recommended = suggestCanonicalClassName(className, css, options)
    if (!recommended) continue
    replacement = replaceClassNameInClassList(replacement, className, recommended)
    suggestions.push({
      actual: className,
      recommended,
      classNames: [className],
      kind: 'class'
    })
  }

  return { replacement, suggestions }
}

function getNativeDeclaration(className: string, css: MasterCSS): NativeDeclaration | undefined {
  const inspection = inspectMasterCSSClass(css, className)
  if (inspection.stateToken) return
  if (inspection.variableEntries.length) return
  if (!inspection.key || !inspection.value) return
  if (inspection.rules.length !== 1) return

  const rule = inspection.rules[0]
  if (rule.type !== UtilityType.Normal) return
  if (rule.layerName !== 'utilities') return
  if (rule.declarationRules?.length) return
  if (rule.registeredUtility.emit.type !== 'property') return

  const entries = Object.entries(rule.declarations || {})
  if (entries.length !== 1) return
  const [property, value] = entries[0]
  if (inspection.key !== property) return

  return {
    property,
    value: String(value),
    important: Boolean(inspection.important)
  }
}

function isSafeVariantToken(token: string) {
  if (!token || (!token.startsWith(':') && !token.startsWith('@'))) return false
  const atSegments = token.split('@').slice(1)
  return atSegments.every((segment) => segment && !segment.includes(':'))
}

function variantKeyword(token: string) {
  if (token === '@dark') return '@dark'
  if (token === '@light') return '@light'
  return `@variant ${token}`
}

function declarationText(declaration: NativeDeclaration) {
  return `${declaration.property}: ${declaration.value}${declaration.important ? ' !important' : ''};`
}

function oneLineBucketText(bucket: ComposeBucket) {
  const parts: string[] = []
  if (bucket.classes.length) {
    parts.push(`@compose ${bucket.classes.join(' ')};`)
  }
  parts.push(...bucket.declarations.map(declarationText))
  return parts.join(' ')
}

function variantBlockText(token: string, bucket: ComposeBucket, indent: string) {
  const body = serializeBucket(bucket, `${indent}    `)
  if (!body.includes('\n')) {
    return `${variantKeyword(token)} { ${oneLineBucketText(bucket)} }`
  }
  return [
    `${variantKeyword(token)} {`,
    body.split('\n').map((line) => `${indent}    ${line}`).join('\n'),
    `${indent}}`
  ].join('\n')
}

function serializeBucket(bucket: ComposeBucket, indent = ''): string {
  const lines: string[] = []
  if (bucket.classes.length) {
    lines.push(`@compose ${bucket.classes.join(' ')};`)
  }
  lines.push(...bucket.declarations.map(declarationText))
  for (const [token, variantBucket] of bucket.variants) {
    lines.push(variantBlockText(token, variantBucket, indent))
  }
  return lines.join('\n')
}

function hasDuplicateNativeDeclarationProperties(bucket: ComposeBucket): boolean {
  const properties = new Set<string>()
  for (const declaration of bucket.declarations) {
    if (properties.has(declaration.property)) return true
    properties.add(declaration.property)
  }
  for (const variantBucket of bucket.variants.values()) {
    if (hasDuplicateNativeDeclarationProperties(variantBucket)) return true
  }
  return false
}

function processLeafClass(
  bucket: ComposeBucket,
  className: string,
  css: MasterCSS,
  options: ResolvedCanonicalClassNameOptions,
  suggestions: CanonicalComposeDirectiveSuggestion[],
  reportNativeDeclaration: boolean
): boolean {
  const declaration = options.preferNativeDeclarationsInCompose
    ? getNativeDeclaration(className, css)
    : undefined
  if (!declaration) {
    bucket.classes.push(className)
    return false
  }

  bucket.declarations.push(declaration)
  if (reportNativeDeclaration) {
    suggestions.push({
      actual: className,
      recommended: declarationText(declaration).slice(0, -1),
      classNames: [className],
      kind: 'native-declaration'
    })
  }
  return true
}

function processClass(
  bucket: ComposeBucket,
  className: string,
  css: MasterCSS,
  options: ResolvedCanonicalClassNameOptions,
  suggestions: CanonicalComposeDirectiveSuggestion[],
  canonicalRecommendations: Set<string>
): boolean {
  const inspection = inspectMasterCSSClass(css, className)
  if (
    options.preferVariantBlocksInCompose
    && inspection.stateToken
    && isSafeVariantToken(inspection.stateToken)
  ) {
    const baseClassName = `${inspection.base}${inspection.important ? '!' : ''}`
    let variantBucket = bucket.variants.get(inspection.stateToken)
    if (!variantBucket) {
      variantBucket = createBucket()
      bucket.variants.set(inspection.stateToken, variantBucket)
    }
    processLeafClass(variantBucket, baseClassName, css, options, suggestions, false)
    if (!canonicalRecommendations.has(className)) {
      suggestions.push({
        actual: className,
        recommended: variantBlockText(inspection.stateToken, variantBucket, ''),
        classNames: [className],
        kind: 'variant-block'
      })
    }
    return true
  }

  return processLeafClass(bucket, className, css, options, suggestions, true)
}

export default function suggestCanonicalComposeDirective(
  classList: string,
  css: MasterCSS,
  options: CanonicalClassNameOptions = defaultCanonicalClassNameOptions
): CanonicalComposeDirectiveResult | undefined {
  const resolvedOptions = resolveOptions(options)
  const canonical = canonicalizeClassList(classList, css, resolvedOptions)
  const canonicalRecommendations = new Set(canonical.suggestions.map((suggestion) => suggestion.recommended))
  const bucket = createBucket()
  const suggestions = [...canonical.suggestions]
  let structuralChange = false

  for (const className of classValues(canonical.replacement)) {
    structuralChange = processClass(bucket, className, css, resolvedOptions, suggestions, canonicalRecommendations)
      || structuralChange
  }

  if (!suggestions.length) return

  const replacement = serializeBucket(bucket)
  return {
    suggestions,
    ...(structuralChange ? { structuralChange } : {}),
    ...(replacement && !hasDuplicateNativeDeclarationProperties(bucket) ? { replacement } : {})
  }
}
