import { type PropertiesHyphen } from 'csstype'
import type { Variable } from '@master/css-schema/css-syntax'
import { isNativeCSSShorthandProperty } from '@master/css-schema/native-css-shorthand'
import type {
  MasterCSSManifest,
  MasterCSSManifestAnimations,
  MasterCSSManifestConditions,
  MasterCSSManifestSettings,
  MasterCSSManifestUtility,
  MasterCSSManifestUtilityMatcher,
  MasterCSSManifestVariableAliasSet,
  MasterCSSManifestVariantBranch,
  MasterCSSManifestVariantToken
} from '@master/css-schema/manifest'
import { flattenMasterCSSManifestVariables } from '@master/css-schema/manifest'
import UtilityType from '@master/css-schema/utility-type'
import { MATCH_NAME_BOUNDARY } from './common'
import builtinKeyAliases from './key-aliases'
import builtinNativeValueNamespaces, { type MasterCSSBuiltinNativeValueNamespace } from './native-value-namespaces'
import builtinSelectorAliases from './selector-aliases'
import type { Condition } from './utils/parse-condition'
import type { SelectorNode } from './utils/parse-selector'
import { normalizeVariableValue } from './utils/css-variables'

export type CompiledUtility = Omit<MasterCSSManifestUtility, 'emit' | 'name' | 'order'> & {
  name: string
  order: number
  emit: MasterCSSManifestUtility['emit'] | { type: 'group' }
  variables?: Map<string, Variable>
}

export type EngineSettings = MasterCSSManifestSettings & {
  rootSize: number
  baseUnit: number
  defaultMode: NonNullable<MasterCSSManifestSettings['defaultMode']>
  modeTrigger: NonNullable<MasterCSSManifestSettings['modeTrigger']>
  modes: string[]
}

const DEFAULT_SETTINGS: EngineSettings = {
  rootSize: 16,
  baseUnit: 4,
  defaultMode: 'light',
  modeTrigger: 'media',
  modes: ['light', 'dark']
}

export interface CompiledManifest {
  manifest: MasterCSSManifest
  settings: EngineSettings
  definedUtilities: CompiledUtility[]
  variableMatcherUtilities: CompiledUtility[]
  valueMatcherUtilities: CompiledUtility[]
  keyMatcherUtilities: CompiledUtility[]
  patternMatcherUtilities: CompiledUtility[]
  arbitraryMatcherUtilities: CompiledUtility[]
  variableMatcherIndex: Map<string, CompiledUtility[]>
  valueMatcherIndex: Map<string, CompiledUtility[]>
  keyMatcherIndex: Map<string, CompiledUtility[]>
  patternMatcherIndex?: Map<string, CompiledUtility[]>
  arbitraryStaticMatcherIndex?: Map<string, CompiledUtility[]>
  selectors: Map<string, SelectorNode[]>
  variables: Map<string, Variable>
  modes: string[]
  conditions: Map<string, Condition>
  variants: Map<MasterCSSManifestVariantToken, MasterCSSManifestVariantBranch[]>
  breakpointConditions: Map<string, Condition>
  containerConditions: Map<string, Condition>
  animations: Map<string, MasterCSSManifestAnimations[string]>
  nativeDeclarationFastPathBlockedProperties: Set<string>
  nativeValueNamespaceUtilities: Map<string, CompiledUtility>
  keyAliases: Map<string, string>
}

// Manifests are compiled by object identity. Mutating a manifest after first use is unsupported.
const compiledManifestCache = new WeakMap<MasterCSSManifest, CompiledManifest>()

function assertMasterCSSManifest(manifest: MasterCSSManifest): asserts manifest is MasterCSSManifest {
  if (!manifest || manifest.version !== 1) {
    throw new TypeError('Unsupported MasterCSSManifest version. Expected version 1.')
  }
  if (Array.isArray((manifest as { variables?: unknown }).variables)) {
    throw new TypeError('Unsupported MasterCSSManifest variables format. Expected namespace-grouped variables.')
  }
  if ('utilityBuckets' in manifest) {
    throw new TypeError('Unsupported MasterCSSManifest utilityBuckets field. Matcher indexes are engine-derived.')
  }
}

function pushUnique(target: string[], values: string[]) {
  for (const value of values) {
    if (!target.includes(value)) target.push(value)
  }
}

function deriveUtilityMetadata(utility: CompiledUtility) {
  const keys = utility.keys ? [...utility.keys] : []
  const aliasGroups = utility.aliasGroups ? [...utility.aliasGroups] : []

  for (const matcher of utility.matchers) {
    if (matcher.type === 'key') {
      pushUnique(keys, matcher.keys)
    } else if (matcher.type === 'variable' || matcher.type === 'value') {
      pushUnique(aliasGroups, matcher.keys)
    }
  }

  if (keys.length && !utility.keys) utility.keys = keys
  if (aliasGroups.length && !utility.aliasGroups) utility.aliasGroups = aliasGroups
  if (!utility.key) utility.key = keys[0] || aliasGroups[0]
}

export function isPureNativeDeclarationUtilityDefinition(
  utility: CompiledUtility
): utility is CompiledUtility & { emit: { type: 'property', property: string } } {
  return utility.emit.type === 'property'
    && utility.id === utility.emit.property
    && utility.name === utility.emit.property
    && !utility.variableAliasRefs?.length
    && !utility.variableAliases?.length
    && !utility.kind
    && !utility.conditions?.length
}

function getVariableKeyByNamespace(variableName: string, namespace: string) {
  const negative = variableName.startsWith('-')
  const positiveName = negative ? variableName.slice(1) : variableName
  if (positiveName !== namespace && !positiveName.startsWith(namespace + '-')) return
  const key = positiveName === namespace ? '' : positiveName.slice(namespace.length + 1)
  return negative ? '-' + key : key
}

function isIndexableMatchName(name: string) {
  for (let index = 0; index < name.length; index++) {
    if (MATCH_NAME_BOUNDARY.has(name[index])) return false
  }
  return true
}

function pushIndexedUtility(index: Map<string, CompiledUtility[]>, key: string, utility: CompiledUtility) {
  const utilities = index.get(key)
  if (utilities) {
    if (!utilities.includes(utility)) utilities.push(utility)
  } else {
    index.set(key, [utility])
  }
}

function createKeyedMatcherIndex(
  utilities: CompiledUtility[],
  matcherType: 'variable' | 'value' | 'key'
) {
  const index = new Map<string, CompiledUtility[]>()
  for (const utility of utilities) {
    for (const matcher of utility.matchers) {
      if (matcher.type !== matcherType) continue
      for (const key of matcher.keys) {
        pushIndexedUtility(index, key, utility)
      }
    }
  }
  return index
}

function createPatternMatcherIndex(utilities: CompiledUtility[]) {
  const index = new Map<string, CompiledUtility[]>()
  for (const utility of utilities) {
    for (const matcher of utility.matchers) {
      if (matcher.type !== 'pattern') continue
      for (const value of matcher.values) {
        const name = matcher.prefix + value
        if (isIndexableMatchName(name)) {
          pushIndexedUtility(index, name, utility)
        }
      }
    }
  }
  return index
}

function canIndexPatternUtilities(utilities: CompiledUtility[]) {
  return utilities.every((utility) =>
    utility.matchers.every((matcher) =>
      matcher.type !== 'pattern'
      || matcher.values.every((value) => isIndexableMatchName(matcher.prefix + value))
    )
  )
}

function createStaticMatcherIndex(utilities: CompiledUtility[]) {
  const index = new Map<string, CompiledUtility[]>()
  for (const utility of utilities) {
    for (const matcher of utility.matchers) {
      if (matcher.type === 'static' && isIndexableMatchName(matcher.name)) {
        pushIndexedUtility(index, matcher.name, utility)
      }
    }
  }
  return index
}

function canIndexStaticOnlyUtilities(utilities: CompiledUtility[]) {
  return utilities.every((utility) =>
    utility.matchers.length
    && utility.matchers.every((matcher) => matcher.type === 'static' && isIndexableMatchName(matcher.name))
  )
}

function createCompiledSettings(manifest: MasterCSSManifest): EngineSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(manifest.settings || {}),
    modes: manifest.settings?.modes ? [...manifest.settings.modes] : [...DEFAULT_SETTINGS.modes]
  }
}

export function cloneCompiledSettings(settings: EngineSettings): EngineSettings {
  return {
    ...settings,
    modes: [...settings.modes]
  }
}

function compileKeyAliases() {
  const keyAliases = new Map<string, string>()
  for (const [key, property] of Object.entries(builtinKeyAliases)) {
    if (key && property && key !== property) {
      keyAliases.set(key, property)
    }
  }
  return keyAliases
}

function compileVariables(manifest: MasterCSSManifest) {
  const variables = new Map<string, Variable>()
  for (const definition of flattenMasterCSSManifestVariables(manifest.variables)) {
    if (!definition.name || !definition.type || definition.value === false) continue
    const normalized = typeof definition.value === 'string' || typeof definition.value === 'number'
      ? normalizeVariableValue(definition.value)
      : undefined
    const value = normalized
      ? normalized.value
      : Array.isArray(definition.value) ? definition.value.join(',') : definition.value
    const dependencies = new Set([
      ...(definition.dependencies || []),
      ...(normalized?.dependencies || [])
    ])
    const modes = definition.modes
      ? Object.fromEntries(Object.entries(definition.modes).map(([mode, modeValue]) => {
        const normalizedMode = typeof modeValue.value === 'string' || typeof modeValue.value === 'number'
          ? normalizeVariableValue(modeValue.value)
          : undefined
        normalizedMode?.dependencies.forEach((dependency) => dependencies.add(dependency))
        return [
          mode,
          {
            ...modeValue,
            value: typeof modeValue.value === 'number'
              ? modeValue.value
              : normalizedMode?.value ?? modeValue.value
          }
        ]
      }))
      : undefined
    variables.set(definition.name, {
      name: definition.name,
      key: definition.key,
      type: definition.type,
      ...(definition.namespace ? { namespace: definition.namespace } : {}),
      ...(value !== undefined ? { value } : {}),
      ...(definition.numeric ? { numeric: { ...definition.numeric } } : {}),
      ...(modes ? { modes } : {}),
      ...(dependencies.size ? { dependencies } : {}),
      ...(definition.inline ? { inline: true } : {}),
      ...(definition.static ? { static: true } : {})
    } as Variable)
  }
  return variables
}

function compileAnimations(manifest: MasterCSSManifest) {
  const animations = new Map<string, MasterCSSManifestAnimations[string]>()
  if (!manifest.animations) return animations
  for (const animationName in manifest.animations) {
    const eachAnimation: MasterCSSManifestAnimations[string] = {}
    animations.set(animationName, eachAnimation)
    const eachKeyframes = manifest.animations[animationName]
    for (const eachKeyframeValue in eachKeyframes) {
      const newValueByPropertyName: any = eachAnimation[eachKeyframeValue] = {}
      const eachKeyframeDeclarations = eachKeyframes[eachKeyframeValue as 'from' | 'to' | `${number}%`]
      for (const propertyName in eachKeyframeDeclarations) {
        newValueByPropertyName[propertyName] = eachKeyframeDeclarations[propertyName as keyof PropertiesHyphen]
      }
    }
  }
  return animations
}

function compileConditionMap(conditions: MasterCSSManifestConditions | undefined) {
  const target = new Map<string, Condition>()
  if (!conditions) return target
  for (const [name, condition] of Object.entries(conditions)) {
    target.set(name, {
      id: condition.id,
      nodes: condition.nodes
    } as Condition)
  }
  return target
}

function compileVariantAliases(manifest: MasterCSSManifest) {
  const selectors = new Map<string, SelectorNode[]>()
  for (const [name, nodes] of Object.entries(builtinSelectorAliases)) {
    selectors.set(name, cloneSelectorNodes(nodes))
  }
  if (manifest.selectors) {
    for (const [name, nodes] of Object.entries(manifest.selectors)) {
      selectors.set(name, cloneSelectorNodes(nodes as SelectorNode[]))
    }
  }

  const variants = new Map<MasterCSSManifestVariantToken, MasterCSSManifestVariantBranch[]>()
  for (const variant of manifest.variants || []) {
    variants.set(variant.token, variant.branches.map((branch) => ({
      ...branch,
      ...(branch.selectorNodes?.length ? { selectorNodes: branch.selectorNodes as SelectorNode[] } : {}),
      ...(branch.conditions?.length ? { conditions: [...branch.conditions] } : {}),
      ...(branch.conditionNodes?.length ? { conditionNodes: branch.conditionNodes.map((condition) => ({
        id: condition.id,
        nodes: condition.nodes
      } as Condition)) } : {})
    })))
  }

  return { selectors, variants }
}

function cloneSelectorNodes(nodes: SelectorNode[]): SelectorNode[] {
  return nodes.map((node) => 'children' in node && node.children?.length
    ? { ...node, children: cloneSelectorNodes(node.children) }
    : { ...node })
}

function createVariableAliasRefResolver(variables: Map<string, Variable>) {
  const aliasRefCache = new Map<string, MasterCSSManifestVariableAliasSet>()
  return (ref: string): MasterCSSManifestVariableAliasSet => {
    const cached = aliasRefCache.get(ref)
    if (cached) return cached

    const namespace = ref[0] === '=' || ref[0] === '~' ? ref.slice(1) : ''
    const aliases: MasterCSSManifestVariableAliasSet = []
    const usedKeys = new Set<string>()
    if (namespace) {
      for (const variable of variables.values()) {
        const key = getVariableKeyByNamespace(variable.name, namespace)
        if (key === undefined || usedKeys.has(key)) continue
        usedKeys.add(key)
        aliases.push([key, variable.name])
      }
    }
    aliasRefCache.set(ref, aliases)
    return aliases
  }
}

function compileUtilityDefinition(
  utility: MasterCSSManifestUtility,
  variables: Map<string, Variable>,
  resolveAliasRef: (ref: string) => MasterCSSManifestVariableAliasSet,
  index = 0,
  count = 1
): CompiledUtility {
  const definedUtility = {
    ...utility,
    name: utility.name || utility.id,
    order: utility.order ?? count - index - 1,
    layer: utility.layer || 'utilities',
    matchers: utility.matchers.map((matcher: MasterCSSManifestUtilityMatcher) => ({ ...matcher }))
  } as CompiledUtility

  const variableAliases = [
    ...(utility.variableAliases || []),
    ...(utility.variableAliasRefs || []).flatMap(resolveAliasRef)
  ]
  if (variableAliases.length) {
    definedUtility.variables = new Map()
    for (const [variableKey, variableName] of variableAliases) {
      if (definedUtility.variables.has(variableKey)) continue
      const variable = variables.get(variableName)
      if (variable) definedUtility.variables.set(variableKey, variable)
    }
  }

  deriveUtilityMetadata(definedUtility)
  return definedUtility
}

function createNativeValueNamespaceUtility(
  property: string,
  namespace: Pick<MasterCSSBuiltinNativeValueNamespace, 'variableAliasRefs'>
): MasterCSSManifestUtility {
  return {
    id: property,
    name: property,
    type: isNativeCSSShorthandProperty(property)
      ? UtilityType.Shorthand
      : UtilityType.Normal,
    order: 0,
    variableAliasRefs: [...namespace.variableAliasRefs],
    emit: {
      type: 'property',
      property
    },
    matchers: [{
      type: 'key',
      keys: [property]
    }]
  }
}

function compileNativeValueNamespaces(
  variables: Map<string, Variable>,
  resolveAliasRef: (ref: string) => MasterCSSManifestVariableAliasSet
) {
  const nativeValueNamespaceUtilities = new Map<string, CompiledUtility>()
  for (const namespace of builtinNativeValueNamespaces) {
    if (!namespace.properties?.length || !namespace.variableAliasRefs?.length) continue
    for (const property of namespace.properties) {
      if (!property || nativeValueNamespaceUtilities.has(property)) continue
      const utility = compileUtilityDefinition(
        createNativeValueNamespaceUtility(property, namespace),
        variables,
        resolveAliasRef
      )
      nativeValueNamespaceUtilities.set(property, utility)
    }
  }
  return nativeValueNamespaceUtilities
}

function registerNativeDeclarationFastPathPolicy(
  target: Set<string>,
  utility: CompiledUtility
) {
  const isPureNativeDeclaration = isPureNativeDeclarationUtilityDefinition(utility)
  for (const matcher of utility.matchers) {
    if (matcher.type !== 'key' && matcher.type !== 'value' && matcher.type !== 'variable') continue
    for (const key of matcher.keys) {
      if (isPureNativeDeclaration && key === utility.emit.property) continue
      target.add(key)
    }
  }
}

function pushBucketUtility(target: CompiledUtility[], utility: CompiledUtility) {
  if (!target.includes(utility)) target.push(utility)
}

function registerUtilityMatcherBuckets(
  utility: CompiledUtility,
  buckets: {
    variableMatcherUtilities: CompiledUtility[]
    valueMatcherUtilities: CompiledUtility[]
    keyMatcherUtilities: CompiledUtility[]
    patternMatcherUtilities: CompiledUtility[]
    arbitraryMatcherUtilities: CompiledUtility[]
  }
) {
  for (const matcher of utility.matchers) {
    switch (matcher.type) {
      case 'variable':
        if (utility.variableAliases?.length || utility.variableAliasRefs?.length) {
          pushBucketUtility(buckets.variableMatcherUtilities, utility)
        }
        break
      case 'value':
        if (utility.kind) pushBucketUtility(buckets.valueMatcherUtilities, utility)
        break
      case 'key':
        pushBucketUtility(buckets.keyMatcherUtilities, utility)
        break
      case 'pattern':
        pushBucketUtility(buckets.patternMatcherUtilities, utility)
        break
      default:
        pushBucketUtility(buckets.arbitraryMatcherUtilities, utility)
        break
    }
  }
}

function compileUtilities(
  manifest: MasterCSSManifest,
  variables: Map<string, Variable>,
  resolveAliasRef: (ref: string) => MasterCSSManifestVariableAliasSet
) {
  const definedUtilities: CompiledUtility[] = []
  const variableMatcherUtilities: CompiledUtility[] = []
  const valueMatcherUtilities: CompiledUtility[] = []
  const keyMatcherUtilities: CompiledUtility[] = []
  const patternMatcherUtilities: CompiledUtility[] = []
  const arbitraryMatcherUtilities: CompiledUtility[] = []
  const nativeDeclarationFastPathBlockedProperties = new Set<string>()

  const manifestUtilities = manifest.utilities || []
  for (let index = 0; index < manifestUtilities.length; index++) {
    const utility = manifestUtilities[index]
    const definedUtility = compileUtilityDefinition(utility, variables, resolveAliasRef, index, manifestUtilities.length)
    registerNativeDeclarationFastPathPolicy(nativeDeclarationFastPathBlockedProperties, definedUtility)
    definedUtilities.push(definedUtility)
    registerUtilityMatcherBuckets(definedUtility, {
      variableMatcherUtilities,
      valueMatcherUtilities,
      keyMatcherUtilities,
      patternMatcherUtilities,
      arbitraryMatcherUtilities
    })
  }

  return {
    definedUtilities,
    variableMatcherUtilities,
    valueMatcherUtilities,
    keyMatcherUtilities,
    patternMatcherUtilities,
    arbitraryMatcherUtilities,
    variableMatcherIndex: createKeyedMatcherIndex(variableMatcherUtilities, 'variable'),
    valueMatcherIndex: createKeyedMatcherIndex(valueMatcherUtilities, 'value'),
    keyMatcherIndex: createKeyedMatcherIndex(keyMatcherUtilities, 'key'),
    patternMatcherIndex: canIndexPatternUtilities(patternMatcherUtilities)
      ? createPatternMatcherIndex(patternMatcherUtilities)
      : undefined,
    arbitraryStaticMatcherIndex: canIndexStaticOnlyUtilities(arbitraryMatcherUtilities)
      ? createStaticMatcherIndex(arbitraryMatcherUtilities)
      : undefined,
    nativeDeclarationFastPathBlockedProperties
  }
}

export function compileManifest(manifest: MasterCSSManifest): CompiledManifest {
  assertMasterCSSManifest(manifest)
  const settings = createCompiledSettings(manifest)
  const variables = compileVariables(manifest)
  const animations = compileAnimations(manifest)
  const { selectors, variants } = compileVariantAliases(manifest)
  const resolveAliasRef = createVariableAliasRefResolver(variables)
  const nativeValueNamespaceUtilities = compileNativeValueNamespaces(variables, resolveAliasRef)
  const utilities = compileUtilities(manifest, variables, resolveAliasRef)

  return {
    manifest,
    settings,
    definedUtilities: utilities.definedUtilities,
    variableMatcherUtilities: utilities.variableMatcherUtilities,
    valueMatcherUtilities: utilities.valueMatcherUtilities,
    keyMatcherUtilities: utilities.keyMatcherUtilities,
    patternMatcherUtilities: utilities.patternMatcherUtilities,
    arbitraryMatcherUtilities: utilities.arbitraryMatcherUtilities,
    variableMatcherIndex: utilities.variableMatcherIndex,
    valueMatcherIndex: utilities.valueMatcherIndex,
    keyMatcherIndex: utilities.keyMatcherIndex,
    patternMatcherIndex: utilities.patternMatcherIndex,
    arbitraryStaticMatcherIndex: utilities.arbitraryStaticMatcherIndex,
    selectors,
    variables,
    modes: [...settings.modes],
    conditions: compileConditionMap(manifest.conditions),
    variants,
    breakpointConditions: compileConditionMap(manifest.breakpointConditions),
    containerConditions: compileConditionMap(manifest.containerConditions),
    animations,
    nativeDeclarationFastPathBlockedProperties: utilities.nativeDeclarationFastPathBlockedProperties,
    nativeValueNamespaceUtilities,
    keyAliases: compileKeyAliases()
  }
}

export function getCompiledManifest(manifest: MasterCSSManifest) {
  const cached = compiledManifestCache.get(manifest)
  if (cached) return cached
  const compiledManifest = compileManifest(manifest)
  compiledManifestCache.set(manifest, compiledManifest)
  return compiledManifest
}
