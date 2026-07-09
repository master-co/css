import {
  CSSDirectiveError,
  readCSSDirectiveVariantReference,
  type CSSDirectiveManifestInput,
  type CSSDirectiveLayerName,
  type CSSDirectiveResult,
  type CSSDirectiveStyleDefinition,
  type CSSDirectiveUtilityDefinition,
  type CSSDirectiveUtilityRuleDefinition,
  type CSSDirectiveVariableDefinition
} from '@master/css-schema/css-directives'
import type { PropertiesHyphen } from 'csstype'
import {
  compareRulePriority,
  createCompilerCSS,
  generateAt,
  generateSelector,
  parseAt,
  type GeneratedRule,
  type MasterCSS
} from '@master/css-engine/compiler'
import type { MasterCSSManifest, MasterCSSManifestUtilityLayerName } from '@master/css-schema/manifest'
import { createMasterCSSManifest, createVariableNameResolver, type CSSDirectiveVariableNameResolver } from './master-css-manifest'
import { combineStyleSelectors } from './utils/selectors'
import wrapAtRules from './utils/wrap-at-rules'
import { cssTreeNativeDeclarationMatcher } from './native-declaration'
import {
  addCompilerDiagnosticCount,
  setCompilerDiagnosticCount,
  timeCompilerDiagnostic,
  type CompilerDiagnosticRecorder
} from './diagnostics'

export interface LowerCSSDirectivesOptions {
  baseManifest?: MasterCSSManifest
  resolutionManifest?: MasterCSSManifest
  onWarning?: (warning: string) => void
  diagnostics?: CompilerDiagnosticRecorder
}

export interface LowerCSSDirectivesResult {
  input: CSSDirectiveManifestInput
  manifest: MasterCSSManifest
  resolutionManifest: MasterCSSManifest
  warnings: string[]
  generatedCSS: string
}

type CSSDirectiveManifestInputSource = CSSDirectiveResult | CSSDirectiveManifestInput
type InputUtilityDefinition = CSSDirectiveUtilityDefinition
type InputVariableDefinition = CSSDirectiveVariableDefinition

interface MergedStyleDefinition {
  selector: string
  declarations: PropertiesHyphen
  atRules?: string[]
  layer?: MasterCSSManifestUtilityLayerName
}

interface ComposedStyleDefinition extends MergedStyleDefinition {
  utility: GeneratedRule
}

type StyleMergeEvent =
  | {
    type: 'compose'
    order: number
    utility: GeneratedRule
    declarations: PropertiesHyphen
  }
  | {
    type: 'native'
    order: number
    declarations: PropertiesHyphen
  }

interface StyleMergeBucket {
  selector: string
  atRules?: string[]
  layer?: MasterCSSManifestUtilityLayerName
  order: number
  events: StyleMergeEvent[]
}

type StyleAtRuleFeature = [string, number, number]

const STYLE_AT_FEATURE_REGEX = /\(\s*(width|height|resolution)\s*(>=|<=|>|<)\s*(-?(?:\d+(?:\.\d+)?|\.\d+))([a-z%]*)\s*\)/g
const MEDIA_MODE_NAMES = new Set(['light', 'dark'])
const DEFAULT_MODE_NONE = 'none'
const CONDITION_VARIABLE_NAMESPACES = new Set(['breakpoint', 'container'])

function isCSSDirectiveResult(input: CSSDirectiveManifestInputSource): input is CSSDirectiveResult {
  return 'manifestInput' in input
}

function getDirectiveInput(input: CSSDirectiveManifestInputSource) {
  return isCSSDirectiveResult(input) ? input.manifestInput : input
}

function getStyleDefinitions(input: CSSDirectiveManifestInputSource) {
  return isCSSDirectiveResult(input) ? input.styleDefinitions : undefined
}

function getResolutionManifest(options: LowerCSSDirectivesOptions) {
  return options.resolutionManifest || options.baseManifest
}

function warn(warnings: string[], options: LowerCSSDirectivesOptions, message: string) {
  warnings.push(message)
  options.onWarning?.(message)
}

function isNamedDefaultMode(defaultMode: CSSDirectiveManifestInput['defaultMode']): defaultMode is string {
  return typeof defaultMode === 'string' && defaultMode !== DEFAULT_MODE_NONE
}

function normalizeVariable(variable: InputVariableDefinition, resolveVariableName: CSSDirectiveVariableNameResolver): CSSDirectiveVariableDefinition {
  const resolved = resolveVariableName(variable)
  if (variable.mode && resolved.namespace && CONDITION_VARIABLE_NAMESPACES.has(resolved.namespace)) {
    throw new Error(`${resolved.namespace[0].toUpperCase()}${resolved.namespace.slice(1)} variables cannot be mode-specific: ${resolved.namespace}-${resolved.key}@${variable.mode}`)
  }
  if (variable.inline && variable.mode) {
    throw new Error(`Inline theme variables cannot be mode-specific: ${resolved.name}@${variable.mode}`)
  }
  if (variable.inline && variable.static) {
    throw new Error(`Inline and static theme variables cannot be combined: ${resolved.name}`)
  }
  return {
    name: resolved.name,
    ...(resolved.namespace ? { namespace: resolved.namespace } : {}),
    key: resolved.key,
    value: variable.value,
    ...(variable.mode ? { mode: variable.mode } : {}),
    ...(variable.inline ? { inline: true } : {}),
    ...(variable.static ? { static: true } : {})
  }
}

function variableSlot(variable: CSSDirectiveVariableDefinition) {
  return [
    variable.key ?? variable.name,
    variable.namespace || '',
    variable.mode || ''
  ].join('\0')
}

function addVariable(input: CSSDirectiveManifestInput, variable: InputVariableDefinition, resolveVariableName: CSSDirectiveVariableNameResolver) {
  const definition = normalizeVariable(variable, resolveVariableName)
  if (definition.mode) {
    input.modes ??= []
    if (!input.modes.includes(definition.mode)) input.modes.push(definition.mode)
  }
  input.variables ??= []
  const foundIndex = input.variables.findIndex((existing) => variableSlot(existing) === variableSlot(definition))
  if (foundIndex !== -1) input.variables.splice(foundIndex, 1)
  input.variables.push(definition)
}

function cloneUtilityRule(rule: CSSDirectiveUtilityRuleDefinition): CSSDirectiveUtilityRuleDefinition {
  return {
    declarations: { ...rule.declarations },
    ...(rule.selector ? { selector: rule.selector } : {}),
    ...(rule.atRules?.length ? { atRules: [...rule.atRules] } : {})
  }
}

function cloneUtility(definition: InputUtilityDefinition): CSSDirectiveUtilityDefinition {
  return {
    ...definition,
    type: definition.type || 'static',
    ...(definition.pattern ? { pattern: { prefix: definition.pattern.prefix, values: [...definition.pattern.values] } } : {}),
    ...(definition.dynamic ? {
      dynamic: {
        key: definition.dynamic.key,
        ...(definition.dynamic.variableAliasRefs?.length ? { variableAliasRefs: [...definition.dynamic.variableAliasRefs] } : {}),
        ...(definition.dynamic.kind ? { kind: definition.dynamic.kind } : {}),
        ...(definition.dynamic.values?.length ? { values: [...definition.dynamic.values] } : {}),
        ...(definition.dynamic.arbitrary ? { arbitrary: true } : {})
      }
    } : {}),
    ...(definition.declarations ? { declarations: { ...definition.declarations } } : {}),
    ...(definition.atRules?.length ? { atRules: [...definition.atRules] } : {}),
    ...(definition.rules?.length ? { rules: definition.rules.map(cloneUtilityRule) } : {})
  }
}

function normalizeDirectiveInput(input: CSSDirectiveManifestInputSource = {}, options: LowerCSSDirectivesOptions = {}): CSSDirectiveManifestInput {
  const source = getDirectiveInput(input)
  const resolveVariableName = createVariableNameResolver(source, { baseManifest: getResolutionManifest(options) })
  const normalized: CSSDirectiveManifestInput = {}
  if (source.rootSize !== undefined) normalized.rootSize = source.rootSize
  if (source.baseUnit !== undefined) normalized.baseUnit = source.baseUnit
  if (source.defaultMode !== undefined) normalized.defaultMode = source.defaultMode
  if (source.modeTrigger !== undefined) normalized.modeTrigger = source.modeTrigger
  if (source.scope !== undefined) normalized.scope = source.scope
  if (source.important !== undefined) normalized.important = source.important
  if (source.variants?.length) normalized.variants = source.variants.map((variant) => ({
    token: variant.token,
    branches: variant.branches.map((branch) => ({
      ...branch,
      ...(branch.atRules?.length ? { atRules: [...branch.atRules] } : {})
    }))
  }))
  if (source.animations) normalized.animations = { ...source.animations }
  if (source.animationOptions) normalized.animationOptions = { ...source.animationOptions }
  if (source.utilities?.length) normalized.utilities = source.utilities.map(cloneUtility)

  for (const mode of source.modes || []) {
    normalized.modes ??= []
    if (!normalized.modes.includes(mode)) normalized.modes.push(mode)
  }
  for (const variable of source.variables || []) {
    addVariable(normalized, variable, resolveVariableName)
  }
  return normalized
}

function collectModeNames(input: CSSDirectiveManifestInput) {
  const modes = new Set(input.modes || [])
  if (isNamedDefaultMode(input.defaultMode)) modes.add(input.defaultMode)
  return modes
}

function collectVariablesByNamespace(input: CSSDirectiveManifestInput, namespace: string, resolveVariableName: CSSDirectiveVariableNameResolver) {
  return new Set((input.variables || [])
    .map(resolveVariableName)
    .filter((variable) => variable.namespace === namespace)
    .map((variable) => variable.key)
    .filter((key): key is string => Boolean(key))
  )
}

function validateTokenConflicts(input: CSSDirectiveManifestInput, resolveVariableName: CSSDirectiveVariableNameResolver) {
  const modes = collectModeNames(input)
  const breakpoints = collectVariablesByNamespace(input, 'breakpoint', resolveVariableName)
  const containers = collectVariablesByNamespace(input, 'container', resolveVariableName)

  for (const mode of modes) {
    if (breakpoints.has(mode)) {
      throw new Error(`Mode "${mode}" conflicts with breakpoint variable "--breakpoint-${mode}"`)
    }
  }

  for (const breakpoint of breakpoints) {
    if (modes.has(breakpoint)) {
      throw new Error(`Breakpoint variable "--breakpoint-${breakpoint}" conflicts with mode "${breakpoint}"`)
    }
  }

  const variantNames = (input.variants || [])
    .filter((variant) => variant.token.startsWith('@'))
    .map((variant) => variant.token.slice(1))
  for (const token of variantNames) {
    if (modes.has(token)) {
      throw new Error(`Variant "${token}" conflicts with mode "${token}"`)
    }
    if (breakpoints.has(token)) {
      throw new Error(`Variant "${token}" conflicts with breakpoint variable "--breakpoint-${token}"`)
    }
    if (containers.has(token)) {
      throw new Error(`Variant "${token}" conflicts with container variable "--container-${token}"`)
    }
  }
}

function warnUnsupportedMediaModes(input: CSSDirectiveManifestInput, options: LowerCSSDirectivesOptions, warnings: string[]) {
  if (input.modeTrigger !== 'media') return

  const customModes = new Set((input.modes || []).filter((mode) => !MEDIA_MODE_NAMES.has(mode)))
  if (isNamedDefaultMode(input.defaultMode) && !MEDIA_MODE_NAMES.has(input.defaultMode)) {
    customModes.add(input.defaultMode)
  }
  if (!customModes.size) return

  const modeList = [...customModes].map((mode) => `"${mode}"`).join(', ')
  const subject = customModes.size === 1 ? 'mode' : 'modes'
  warn(warnings, options, `Custom ${subject} ${modeList} will not work with mode-trigger: media. Browsers only support light and dark prefers-color-scheme values; use mode-trigger: class or host for custom modes.`)
}

function createDirectiveCSS(input: CSSDirectiveManifestInput, options: LowerCSSDirectivesOptions) {
  const manifest = timeCompilerDiagnostic(options.diagnostics, 'lower-directive-css-manifest-creation-ms', () => createMasterCSSManifest(input, {
    baseManifest: getResolutionManifest(options),
    diagnostics: options.diagnostics
  }))
  return timeCompilerDiagnostic(options.diagnostics, 'lower-create-compiler-css-ms', () => createCompilerCSS(manifest, undefined, {
    nativeDeclarationMatcher: cssTreeNativeDeclarationMatcher
  }))
}

function getUtilityAtRuleDefinitions(utility: GeneratedRule) {
  const atRules: string[] = []
  if (utility.atRules) {
    for (const id of ['container', 'starting-style', 'supports', 'media', 'layer'] as const) {
      const nodes = utility.atRules[id]
      if (!nodes) continue
      if (id === 'layer' && utility.explicitLayerName) continue
      atRules.push(generateAt({ id, nodes }))
    }
  }
  return atRules
}

function getComposedUtilitySelector(utility: GeneratedRule, css: MasterCSS) {
  let selector = utility.selectorTemplate
    ? '&'
    : utility.selectorNodes
      ? generateSelector(utility.selectorNodes, '&')
      : '&'
  if (utility.selectorTemplate) {
    selector = utility.selectorTemplate.replace(/&/g, selector)
  }
  if (utility.mode && css.settings.modeTrigger !== 'media') {
    const modeSelector = css.getModeSelector(utility.mode)
    if (modeSelector) selector = `${modeSelector} ${selector}`
  }
  return selector
}

function cloneDeclarations(declarations: PropertiesHyphen, important?: boolean) {
  const result: PropertiesHyphen = {}
  for (const propertyName in declarations) {
    const propertyValue = declarations[propertyName as keyof PropertiesHyphen]
    const value = String(propertyValue)
    result[propertyName as keyof PropertiesHyphen] = (important && !value.endsWith('!important'))
      ? `${value}!important` as any
      : value as any
  }
  return result
}

function createStyleDefinitionsFromCompose(definition: Extract<CSSDirectiveStyleDefinition, { type: 'compose' }>, css: MasterCSS): ComposedStyleDefinition[] {
  const utilities = css.createRules(definition.className)
  if (!utilities.length) {
    throw new CSSDirectiveError(
      'invalid-compose-class',
      `Invalid @compose class: ${definition.className}`,
      definition.source || definition.directiveSource
    )
  }
  return utilities.flatMap((utility) => {
    const selector = getComposedUtilitySelector(utility, css)
    const layer = utility.explicitLayerName
    const utilityAtRules = getUtilityAtRuleDefinitions(utility)
    const declarationRules = utility.declarationRules || (utility.declarations ? [{ declarations: utility.declarations }] : [])
    return declarationRules.map(({ declarations, atRules, selector: ruleSelector }) => ({
      utility,
      selector: ruleSelector ? combineStyleSelectors(selector, ruleSelector) : selector,
      declarations: cloneDeclarations(declarations, utility.important),
      ...(layer ? { layer } : {}),
      ...([...utilityAtRules, ...(atRules || [])].length
        ? { atRules: [...utilityAtRules, ...(atRules || [])] }
        : {})
    }))
  })
}

function combineSelectorWrapper(selector: string, wrapper: string) {
  return wrapper.replace(/&/g, selector)
}

function resolveSelectorAliases(selector: string, css: MasterCSS) {
  const selectorTokens = [...css.selectors.keys()]
    .filter((token) => token.startsWith(':'))
    .sort((a, b) => b.length - a.length)
  if (!selectorTokens.length) return selector

  let result = ''
  let quote = ''
  let attributeDepth = 0
  for (let index = 0; index < selector.length;) {
    const char = selector[index]
    if (quote) {
      result += char
      if (char === '\\') {
        result += selector[++index] || ''
      } else if (char === quote) {
        quote = ''
      }
      index++
      continue
    }
    if (char === '"' || char === '\'') {
      quote = char
      result += char
      index++
      continue
    }
    if (char === '[') {
      attributeDepth++
      result += char
      index++
      continue
    }
    if (char === ']') {
      if (attributeDepth > 0) attributeDepth--
      result += char
      index++
      continue
    }
    if (!attributeDepth) {
      const matchedToken = selectorTokens.find((token) => {
        if (!selector.startsWith(token, index)) return false
        const next = selector[index + token.length]
        return next === undefined || next === '(' || !/[-_a-zA-Z0-9]/.test(next)
      })
      if (matchedToken) {
        const nodes = css.selectors.get(matchedToken)
        if (nodes?.length) {
          result += generateSelector(nodes, '')
          index += matchedToken.length
          continue
        }
      }
    }
    result += char
    index++
  }

  return result
}

interface ResolvedStyleBranch {
  selector: string
  atRules?: string[]
  layer?: MasterCSSManifestUtilityLayerName
}

interface ResolvedVariantReferenceBranch {
  selector?: string
  atRules?: string[]
  layer?: MasterCSSManifestUtilityLayerName
}

function mergeResolvedVariantReferenceBranch(
  branch: ResolvedVariantReferenceBranch,
  resolved: ResolvedVariantReferenceBranch,
  token: string
): ResolvedVariantReferenceBranch {
  const nextLayer = resolved.layer || branch.layer
  if (branch.layer && resolved.layer && branch.layer !== resolved.layer) {
    throw new Error(`@variant ${token} cannot assign multiple layers`)
  }
  return {
    selector: resolved.selector
      ? combineSelectorWrapper(branch.selector || '&', resolved.selector)
      : branch.selector,
    atRules: [...(branch.atRules || []), ...(resolved.atRules || [])],
    ...(nextLayer ? { layer: nextLayer } : {})
  }
}

function cloneConfiguredVariantBranches(token: string, css: MasterCSS): ResolvedVariantReferenceBranch[] | undefined {
  const configuredVariant = css.resolveVariant(token as any)
  if (configuredVariant) {
    return configuredVariant.map((branch) => ({
      ...(branch.selector ? { selector: branch.selector } : {}),
      ...(branch.atRules?.length ? { atRules: [...branch.atRules] } : {}),
      ...(branch.layer ? { layer: branch.layer } : {})
    }))
  }
}

function resolveAtVariantReference(token: string, css: MasterCSS): ResolvedVariantReferenceBranch[] {
  const configuredVariant = cloneConfiguredVariantBranches(token, css)
  if (configuredVariant) return configuredVariant
  const atToken = token.slice(1)
  if (css.modes.includes(atToken)) {
    const modeSelector = css.getModeSelector(atToken)
    return modeSelector
      ? [{ selector: `${modeSelector} &` }]
      : [{ atRules: [`@media (prefers-color-scheme:${atToken})`] }]
  }

  if (/^-?[_a-zA-Z][-_a-zA-Z0-9]*$/.test(atToken) && !css.atRules.has(atToken)) {
    throw new Error(`Unknown @variant token: ${token}`)
  }

  return [{ atRules: [generateAt(parseAt(atToken, css))] }]
}

function resolveMasterVariantReference(token: string, css: MasterCSS): ResolvedVariantReferenceBranch[] {
  if (token.startsWith(':')) {
    throw new Error('@variant no longer accepts selector variants. Use nested selectors directly.')
  }
  if (!token.startsWith('@')) {
    throw new Error(`@variant requires a full variant token: ${token}`)
  }

  let branches: ResolvedVariantReferenceBranch[] = [{}]
  const conditionStacks = token.slice(1).split('@')

  for (const conditionStack of conditionStacks) {
    if (!conditionStack) continue
    const resolvedBranches = resolveAtVariantReference(`@${conditionStack}`, css)
    branches = branches.flatMap((branch) =>
      resolvedBranches.map((resolved) => mergeResolvedVariantReferenceBranch(branch, resolved, token))
    )
  }

  return branches
}

function resolveConfiguredBranches(atRules: string[] | undefined, css: MasterCSS, selector = '&', layer?: MasterCSSManifestUtilityLayerName): ResolvedStyleBranch[] {
  let branches: ResolvedStyleBranch[] = [{ selector, ...(layer ? { layer } : {}) }]
  if (!atRules?.length) {
    return branches.map((branch) => ({
      ...branch,
      selector: resolveSelectorAliases(branch.selector, css)
    }))
  }

  for (const atRule of atRules) {
    const token = readCSSDirectiveVariantReference(atRule)
    if (!token) {
      branches = branches.map((branch) => ({
        ...branch,
        atRules: [...(branch.atRules || []), atRule]
      }))
      continue
    }

    const resolvedBranches = resolveMasterVariantReference(token, css)
    branches = branches.flatMap((branch) =>
      resolvedBranches.map((resolved) => {
        const nextLayer = resolved.layer || branch.layer
        if (branch.layer && resolved.layer && branch.layer !== resolved.layer) {
          throw new Error(`@variant ${token} cannot assign multiple layers`)
        }
        return {
          selector: resolved.selector
            ? combineSelectorWrapper(branch.selector, resolved.selector)
            : branch.selector,
          atRules: [...(branch.atRules || []), ...(resolved.atRules || [])],
          ...(nextLayer ? { layer: nextLayer } : {})
        }
      })
    )
  }

  return branches.map((branch) => ({
    selector: resolveSelectorAliases(branch.selector, css),
    ...(branch.atRules?.length ? { atRules: branch.atRules } : {}),
    ...(branch.layer ? { layer: branch.layer } : {})
  }))
}

function ensureUtilityRules(definition: CSSDirectiveUtilityDefinition) {
  if (!definition.declarations) return
  const declarations = definition.declarations
  delete definition.declarations
  const atRules = definition.atRules
  delete definition.atRules
  definition.rules ??= []
  definition.rules.push({
    ...(atRules?.length ? { atRules: [...atRules] } : {}),
    declarations
  })
}

function finalizeUtilityDefinitions(input: CSSDirectiveManifestInput, css: MasterCSS, options: LowerCSSDirectivesOptions) {
  const utilities = input.utilities
  if (!utilities?.length) return

  const diagnostics = options.diagnostics
  setCompilerDiagnosticCount(diagnostics, 'lower-utility-definition-count', utilities.length)
  for (const definition of utilities) {
    if (definition.atRules?.some(readCSSDirectiveVariantReference)) {
      const resolvedBranches = timeCompilerDiagnostic(diagnostics, 'lower-utility-at-rule-resolution-ms', () => resolveConfiguredBranches(definition.atRules, css))
      delete definition.atRules
      if (definition.declarations) {
        definition.rules ??= []
        for (const resolved of resolvedBranches) {
          definition.rules.push({
            declarations: definition.declarations,
            ...(resolved.selector !== '&' ? { selector: resolved.selector } : {}),
            ...(resolved.atRules?.length ? { atRules: resolved.atRules } : {})
          })
        }
        delete definition.declarations
      }
    }

    if (!definition.rules?.length) continue
    definition.rules = definition.rules.flatMap((rule) => {
      const resolvedBranches = timeCompilerDiagnostic(diagnostics, 'lower-utility-rule-resolution-ms', () => resolveConfiguredBranches(rule.atRules, css, rule.selector || '&'))
      return resolvedBranches.map((resolved) => ({
        declarations: rule.declarations,
        ...(resolved.selector !== '&' ? { selector: resolved.selector } : {}),
        ...(resolved.atRules?.length ? { atRules: resolved.atRules } : {})
      }))
    })
  }
}

function getStyleMergeBucketKey(selector: string, atRules: string[] | undefined, layer: MasterCSSManifestUtilityLayerName | undefined) {
  return JSON.stringify([layer || '', selector, atRules || []])
}

function pushStyleMergeEvent(
  buckets: Map<string, StyleMergeBucket>,
  selector: string,
  atRules: string[] | undefined,
  layer: MasterCSSManifestUtilityLayerName | undefined,
  event: StyleMergeEvent
) {
  const key = getStyleMergeBucketKey(selector, atRules, layer)
  const bucket = buckets.get(key) || {
    selector,
    ...(atRules?.length ? { atRules } : {}),
    ...(layer ? { layer } : {}),
    order: event.order,
    events: []
  } satisfies StyleMergeBucket
  bucket.order = Math.min(bucket.order, event.order)
  bucket.events.push(event)
  buckets.set(key, bucket)
}

function isImportantStyleDeclarationValue(value: unknown) {
  return String(value).trim().endsWith('!important')
}

function applyStyleDeclaration(declarations: PropertiesHyphen, propertyName: string, value: unknown) {
  const key = propertyName as keyof PropertiesHyphen
  const currentValue = declarations[key]
  if (currentValue !== undefined && isImportantStyleDeclarationValue(currentValue) && !isImportantStyleDeclarationValue(value)) {
    return
  }
  delete declarations[key]
  declarations[key] = value as any
}

function applyStyleDeclarations(declarations: PropertiesHyphen, incomingDeclarations: PropertiesHyphen) {
  for (const propertyName in incomingDeclarations) {
    applyStyleDeclaration(declarations, propertyName, incomingDeclarations[propertyName as keyof PropertiesHyphen])
  }
}

function createMergedStyleDefinition(bucket: StyleMergeBucket): MergedStyleDefinition | undefined {
  const declarations: PropertiesHyphen = {}
  const composeBatch: Extract<StyleMergeEvent, { type: 'compose' }>[] = []
  const flushComposeBatch = () => {
    composeBatch.sort((a, b) => compareRulePriority(a.utility, b.utility) || a.order - b.order)
    for (const event of composeBatch) {
      applyStyleDeclarations(declarations, event.declarations)
    }
    composeBatch.length = 0
  }

  for (const event of [...bucket.events].sort((a, b) => a.order - b.order)) {
    if (event.type === 'compose') {
      composeBatch.push(event)
      continue
    }
    flushComposeBatch()
    applyStyleDeclarations(declarations, event.declarations)
  }
  flushComposeBatch()

  if (!Object.keys(declarations).length) return
  return {
    selector: bucket.selector,
    declarations,
    ...(bucket.atRules?.length ? { atRules: bucket.atRules } : {}),
    ...(bucket.layer ? { layer: bucket.layer } : {})
  }
}

function normalizeStyleAtFeatureValue(value: number, unit: string, rootSize: number) {
  if (unit === 'px') return value / rootSize
  return value
}

function getStyleAtRuleFeatures(atRules: string[] | undefined, rootSize: number) {
  const featureMap = new Map<string, { min?: number, max?: number }>()
  for (const atRule of atRules || []) {
    for (const match of atRule.matchAll(STYLE_AT_FEATURE_REGEX)) {
      const [, name, operator, rawValue, unit] = match
      const value = normalizeStyleAtFeatureValue(Number(rawValue), unit, rootSize)
      const entry = featureMap.get(name) ?? {}
      switch (operator) {
        case '>':
          entry.min = value + 0.02
          break
        case '>=':
          entry.min = value
          break
        case '<':
          entry.max = value - 0.02
          break
        case '<=':
          entry.max = value
          break
      }
      featureMap.set(name, entry)
    }
  }
  return [...featureMap.entries()]
    .map(([name, entry]) => [
      name,
      entry.min ?? 0,
      entry.max ?? Number.MAX_SAFE_INTEGER
    ] as StyleAtRuleFeature)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
}

function compareStyleAtRuleFeatures(a: StyleAtRuleFeature[], b: StyleAtRuleFeature[]) {
  const len = Math.max(a.length, b.length)
  for (let index = 0; index < len; index++) {
    const left = a[index]
    const right = b[index]
    if (!left) return -1
    if (!right) return 1
    const [nameA, minA, maxA] = left
    const [nameB, minB, maxB] = right
    const nameCompare = nameA.localeCompare(nameB, undefined, { numeric: true })
    if (nameCompare !== 0) return nameCompare
    const rangeA = maxA - minA
    const rangeB = maxB - minB
    if (rangeA !== rangeB) return rangeB - rangeA
    if (minA !== minB) return minB - minA
    if (maxA !== maxB) return maxB - maxA
  }
  return 0
}

function compareStyleMergeBuckets(a: StyleMergeBucket, b: StyleMergeBucket, rootSize: number) {
  const layerA = a.layer || 'components'
  const layerB = b.layer || 'components'
  if (layerA === layerB && a.selector === b.selector) {
    const atRuleStateA = a.atRules?.length ? 1 : 0
    const atRuleStateB = b.atRules?.length ? 1 : 0
    if (atRuleStateA !== atRuleStateB) return atRuleStateA - atRuleStateB
    if (atRuleStateA && atRuleStateB) {
      const featuresA = getStyleAtRuleFeatures(a.atRules, rootSize)
      const featuresB = getStyleAtRuleFeatures(b.atRules, rootSize)
      if (featuresA.length && featuresB.length) {
        const featureCompare = compareStyleAtRuleFeatures(featuresA, featuresB)
        if (featureCompare !== 0) return featureCompare
      }
    }
  }
  return a.order - b.order
}

function createMergedStyleDefinitions(definitions: CSSDirectiveStyleDefinition[], css: MasterCSS, targetLayer?: MasterCSSManifestUtilityLayerName) {
  const buckets = new Map<string, StyleMergeBucket>()
  for (const definition of definitions) {
    if (definition.type === 'compose') {
      const composedDefinitions = createStyleDefinitionsFromCompose(definition, css)
      for (const composedDefinition of composedDefinitions) {
        const { atRules: composedAtRules, ...composedDefinitionWithoutAtRules } = composedDefinition
        const selector = combineStyleSelectors(definition.selector, composedDefinition.selector)
        const resolvedBranches = resolveConfiguredBranches([
          ...(definition.atRules || []),
          ...(composedAtRules || [])
        ], css, selector, targetLayer || composedDefinitionWithoutAtRules.layer)
        for (const resolved of resolvedBranches) {
          pushStyleMergeEvent(buckets, resolved.selector, resolved.atRules, resolved.layer, {
            type: 'compose',
            order: definition.order,
            utility: composedDefinitionWithoutAtRules.utility,
            declarations: composedDefinitionWithoutAtRules.declarations
          })
        }
      }
    } else {
      const resolvedBranches = resolveConfiguredBranches(definition.atRules, css, definition.selector, targetLayer || definition.layer)
      for (const resolved of resolvedBranches) {
        pushStyleMergeEvent(buckets, resolved.selector, resolved.atRules, resolved.layer, {
          type: 'native',
          order: definition.order,
          declarations: definition.declarations
        })
      }
    }
  }

  const rootSize = css.settings.rootSize || 16
  return [...buckets.values()]
    .sort((a, b) => compareStyleMergeBuckets(a, b, rootSize))
    .flatMap((bucket) => {
      const definition = createMergedStyleDefinition(bucket)
      return definition ? [definition] : []
    })
}

type ManagedStyleDefinition = CSSDirectiveStyleDefinition & { name: string }
type ManagedComposeStyleDefinition = Extract<CSSDirectiveStyleDefinition, { type: 'compose' }> & { name: string }

interface ManagedStyleDefinitionPlan {
  sortedKeys: string[]
  dependenciesByKey: Map<string, Set<string>>
}

function isManagedStyleDefinition(definition: CSSDirectiveStyleDefinition): definition is ManagedStyleDefinition {
  return Boolean(definition.name)
}

function getManagedStyleDefinitionLayer(definition: ManagedStyleDefinition): MasterCSSManifestUtilityLayerName {
  return definition.layer || 'components'
}

function getManagedStyleDefinitionKey(definition: ManagedStyleDefinition) {
  return `${definition.name}\0${getManagedStyleDefinitionLayer(definition)}`
}

function splitManagedStyleDefinitionKey(key: string) {
  const [name, layer] = key.split('\0')
  return {
    name,
    layer: layer as MasterCSSManifestUtilityLayerName
  }
}

function getManagedComposeDependencyName(className: string, names: Set<string>) {
  const sortedNames = [...names].sort((a, b) => b.length - a.length)
  for (const name of sortedNames) {
    if (className === name) return name
    const next = className[name.length]
    if (className.startsWith(name) && (next === ':' || next === '@' || next === '!')) {
      return name
    }
  }
}

function createManagedStyleDefinitionPlan(
  groups: Map<string, ManagedStyleDefinition[]>,
  keysByName: Map<string, Set<string>>
): ManagedStyleDefinitionPlan {
  const names = new Set(keysByName.keys())
  const dependenciesByKey = new Map<string, Set<string>>()
  const dependencyDefinitions = new Map<string, ManagedComposeStyleDefinition>()
  for (const [key, definitions] of groups) {
    const keyDependencies = new Set<string>()
    for (const definition of definitions) {
      if (definition.type !== 'compose') continue
      const dependencyName = getManagedComposeDependencyName(definition.className, names)
      if (!dependencyName) continue
      for (const dependencyKey of keysByName.get(dependencyName) || []) {
        keyDependencies.add(dependencyKey)
        dependencyDefinitions.set(`${key}\0${dependencyKey}`, definition)
      }
    }
    dependenciesByKey.set(key, keyDependencies)
  }

  const sorted: string[] = []
  const seen = new Set<string>()
  const visiting = new Set<string>()
  const path: string[] = []

  function visit(key: string) {
    if (seen.has(key)) return
    if (visiting.has(key)) {
      const cycleKeys = [...path.slice(path.indexOf(key)), key]
      const cycle = cycleKeys
        .map((cycleKey) => splitManagedStyleDefinitionKey(cycleKey).name)
        .join(' -> ')
      const related = cycleKeys.slice(0, -1).flatMap((cycleKey, index) => {
        const nextKey = cycleKeys[index + 1]
        const definition = dependencyDefinitions.get(`${cycleKey}\0${nextKey}`)
        const source = definition?.source || definition?.directiveSource
        return source
          ? [{
            message: `${splitManagedStyleDefinitionKey(cycleKey).name} composes ${definition.className}`,
            source
          }]
          : []
      })
      throw new CSSDirectiveError(
        'circular-compose-dependency',
        `Circular @compose dependency detected: ${cycle}`,
        related[0]?.source,
        related
      )
    }
    visiting.add(key)
    path.push(key)
    for (const dependency of dependenciesByKey.get(key) || []) {
      visit(dependency)
    }
    path.pop()
    visiting.delete(key)
    seen.add(key)
    sorted.push(key)
  }

  for (const key of groups.keys()) {
    visit(key)
  }
  return {
    sortedKeys: sorted,
    dependenciesByKey
  }
}

function renderStyleDefinitions(definitions: MergedStyleDefinition[]) {
  return definitions.map((definition) => {
    const body = Object.entries(definition.declarations)
      .map(([propertyName, value]) => `${propertyName}:${value}`)
      .join(';')
    return wrapAtRules(`${definition.selector}{${body}}`, definition.atRules)
  }).join('')
}

function getStaticUtilityDefinition(input: CSSDirectiveManifestInput, name: string, layer: CSSDirectiveLayerName) {
  input.utilities ??= []
  const existing = input.utilities.find((utility) =>
    utility.name === name
    && (utility.layer || 'utilities') === layer
  )
  if (existing) {
    existing.type = 'static'
    existing.layer = layer
    return existing
  }
  const utility: CSSDirectiveUtilityDefinition = {
    name,
    type: 'static',
    layer
  }
  input.utilities.push(utility)
  return utility
}

function pushStaticUtilityStyleRule(definition: CSSDirectiveUtilityDefinition, styleDefinition: MergedStyleDefinition) {
  const rule: CSSDirectiveUtilityRuleDefinition = {
    declarations: styleDefinition.declarations as Record<string, string>,
    ...(styleDefinition.selector !== '&' ? { selector: styleDefinition.selector } : {}),
    ...(styleDefinition.atRules?.length ? { atRules: styleDefinition.atRules } : {})
  }
  if (!definition.declarations && !definition.rules?.length && !rule.selector && !rule.atRules?.length) {
    definition.declarations = rule.declarations
    return
  }
  ensureUtilityRules(definition)
  definition.rules ??= []
  definition.rules.push(rule)
}

function hasUnrefreshedDependencies(dependencies: Set<string> | undefined, unrefreshedKeys: Set<string>) {
  if (!dependencies?.size || !unrefreshedKeys.size) return false
  for (const dependency of dependencies) {
    if (unrefreshedKeys.has(dependency)) return true
  }
  return false
}

function refreshManagedStyleContext(
  input: CSSDirectiveManifestInput,
  css: MasterCSS,
  options: LowerCSSDirectivesOptions
) {
  const diagnostics = options.diagnostics
  const refreshManifest = timeCompilerDiagnostic(diagnostics, 'lower-managed-refresh-manifest-creation-ms', () => createMasterCSSManifest(input, {
    baseManifest: getResolutionManifest(options),
    diagnostics
  }))
  timeCompilerDiagnostic(diagnostics, 'lower-managed-css-refresh-ms', () => css.refresh(refreshManifest))
  addCompilerDiagnosticCount(diagnostics, 'lower-managed-style-refresh-count')
}

function finalizeStyleDefinitions(
  input: CSSDirectiveManifestInput,
  styleDefinitions: CSSDirectiveStyleDefinition[] | undefined,
  css: MasterCSS,
  options: LowerCSSDirectivesOptions
) {
  if (!styleDefinitions?.length) return ''

  const diagnostics = options.diagnostics
  setCompilerDiagnosticCount(diagnostics, 'lower-style-definition-count', styleDefinitions.length)
  const managedGroups = new Map<string, ManagedStyleDefinition[]>()
  const keysByName = new Map<string, Set<string>>()
  const nativeDefinitions: CSSDirectiveStyleDefinition[] = []

  timeCompilerDiagnostic(diagnostics, 'lower-style-definition-grouping-ms', () => {
    for (const definition of styleDefinitions) {
      if (!isManagedStyleDefinition(definition)) {
        nativeDefinitions.push(definition)
        continue
      }
      const key = getManagedStyleDefinitionKey(definition)
      const group = managedGroups.get(key)
      if (group) {
        group.push(definition)
      } else {
        managedGroups.set(key, [definition])
      }
      const nameKeys = keysByName.get(definition.name)
      if (nameKeys) {
        nameKeys.add(key)
      } else {
        keysByName.set(definition.name, new Set([key]))
      }
    }
  })

  setCompilerDiagnosticCount(diagnostics, 'lower-managed-style-definition-count', styleDefinitions.length - nativeDefinitions.length)
  setCompilerDiagnosticCount(diagnostics, 'lower-native-style-definition-count', nativeDefinitions.length)
  setCompilerDiagnosticCount(diagnostics, 'lower-managed-style-group-count', managedGroups.size)
  setCompilerDiagnosticCount(diagnostics, 'lower-managed-style-refresh-count', 0)

  const managedPlan = timeCompilerDiagnostic(diagnostics, 'lower-managed-style-sort-ms', () => createManagedStyleDefinitionPlan(managedGroups, keysByName))
  const unrefreshedKeys = new Set<string>()
  for (const key of managedPlan.sortedKeys) {
    if (hasUnrefreshedDependencies(managedPlan.dependenciesByKey.get(key), unrefreshedKeys)) {
      refreshManagedStyleContext(input, css, options)
      unrefreshedKeys.clear()
    }

    const definitions = managedGroups.get(key)
    if (!definitions) continue
    const { name, layer } = splitManagedStyleDefinitionKey(key)
    const mergedDefinitions = timeCompilerDiagnostic(diagnostics, 'lower-managed-style-merge-ms', () => createMergedStyleDefinitions(definitions, css, layer))
    addCompilerDiagnosticCount(diagnostics, 'lower-managed-merged-style-definition-count', mergedDefinitions.length)
    timeCompilerDiagnostic(diagnostics, 'lower-managed-style-push-ms', () => {
      for (const definition of mergedDefinitions) {
        const utilityDefinition = getStaticUtilityDefinition(input, name, layer)
        pushStaticUtilityStyleRule(utilityDefinition, definition)
      }
    })
    unrefreshedKeys.add(key)
  }

  if (!nativeDefinitions.length) return ''
  if (unrefreshedKeys.size) {
    refreshManagedStyleContext(input, css, options)
    unrefreshedKeys.clear()
  }
  const mergedNativeDefinitions = timeCompilerDiagnostic(diagnostics, 'lower-native-style-merge-ms', () => createMergedStyleDefinitions(nativeDefinitions, css))
  addCompilerDiagnosticCount(diagnostics, 'lower-native-merged-style-definition-count', mergedNativeDefinitions.length)
  return timeCompilerDiagnostic(diagnostics, 'lower-native-style-render-ms', () => renderStyleDefinitions(mergedNativeDefinitions))
}

export default function lowerCSSDirectives(input: CSSDirectiveManifestInputSource, options: LowerCSSDirectivesOptions = {}): LowerCSSDirectivesResult {
  const diagnostics = options.diagnostics
  const directiveInput = timeCompilerDiagnostic(diagnostics, 'lower-normalize-directive-input-ms', () => normalizeDirectiveInput(input, options))
  setCompilerDiagnosticCount(diagnostics, 'lower-input-variable-count', directiveInput.variables?.length || 0)
  setCompilerDiagnosticCount(diagnostics, 'lower-input-utility-count', directiveInput.utilities?.length || 0)
  setCompilerDiagnosticCount(diagnostics, 'lower-input-variant-count', directiveInput.variants?.length || 0)
  setCompilerDiagnosticCount(diagnostics, 'lower-input-animation-count', Object.keys(directiveInput.animations || {}).length)
  const resolveVariableName = timeCompilerDiagnostic(diagnostics, 'lower-variable-name-resolver-ms', () => createVariableNameResolver(directiveInput, { baseManifest: getResolutionManifest(options) }))
  const warnings = isCSSDirectiveResult(input) ? [...input.warnings] : []

  timeCompilerDiagnostic(diagnostics, 'lower-validate-token-conflicts-ms', () => validateTokenConflicts(directiveInput, resolveVariableName))
  timeCompilerDiagnostic(diagnostics, 'lower-warn-media-modes-ms', () => warnUnsupportedMediaModes(directiveInput, options, warnings))

  const css = timeCompilerDiagnostic(diagnostics, 'lower-create-directive-css-total-ms', () => createDirectiveCSS(directiveInput, options))
  timeCompilerDiagnostic(diagnostics, 'lower-finalize-utility-definitions-ms', () => finalizeUtilityDefinitions(directiveInput, css, options))
  const initialRefreshManifest = timeCompilerDiagnostic(diagnostics, 'lower-initial-refresh-manifest-creation-ms', () => createMasterCSSManifest(directiveInput, {
    baseManifest: getResolutionManifest(options),
    diagnostics
  }))
  timeCompilerDiagnostic(diagnostics, 'lower-initial-css-refresh-ms', () => css.refresh(initialRefreshManifest))
  const generatedCSS = timeCompilerDiagnostic(diagnostics, 'lower-finalize-style-definitions-total-ms', () => finalizeStyleDefinitions(directiveInput, getStyleDefinitions(input), css, options))
  const manifest = timeCompilerDiagnostic(diagnostics, 'lower-final-manifest-creation-ms', () => createMasterCSSManifest(directiveInput, {
    baseManifest: options.baseManifest,
    diagnostics
  }))

  return {
    input: directiveInput,
    manifest,
    resolutionManifest: initialRefreshManifest,
    warnings,
    generatedCSS
  }
}
