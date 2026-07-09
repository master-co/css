import { AnimationRule, VariableRule, type MasterCSSEmittedGlobals } from '@master/css'
import { collectAnimationNamesFromDeclaration, collectCSSVariableReferences } from '@master/css-engine'
import { createCSSWithNativeDeclarations } from '@master/css-validator/native-declaration'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

type StylesheetCSS = ReturnType<typeof createCSSWithNativeDeclarations>

export interface RenderCompiledManifestCSSOptions {
  manifest: MasterCSSManifest
  classNames?: Iterable<string>
  nativeCSS?: string | string[]
  includeGeneratedCSS?: boolean
  emittedGlobals?: MasterCSSEmittedGlobals
}

export interface RenderCompiledManifestCSSResult {
  css: string
  nativeCSS: string
  generatedCSS: string
  emittedGlobals: Required<MasterCSSEmittedGlobals>
}

function normalizeNativeCSS(nativeCSS: string | string[] | undefined) {
  return (Array.isArray(nativeCSS) ? nativeCSS : [nativeCSS])
    .filter((source): source is string => Boolean(source))
    .map((source) => source.replace(/\r\n?/g, '\n'))
}

function collectStyleCSSVariableReferences(nativeCSS: string[]) {
  const references = new Set<string>()
  for (const source of nativeCSS) {
    for (const reference of collectCSSVariableReferences(source)) {
      references.add(reference)
    }
  }
  return references
}

function collectCSSKeyframeNames(source: string) {
  const names = new Set<string>()
  for (const match of source.matchAll(/@keyframes\s+(-?[_a-zA-Z][-_a-zA-Z0-9]*)/g)) {
    names.add(match[1])
  }
  return names
}

function collectStyleCSSKeyframeNames(nativeCSS: string[]) {
  const names = new Set<string>()
  for (const source of nativeCSS) {
    for (const name of collectCSSKeyframeNames(source)) {
      names.add(name)
    }
  }
  return names
}

function insertVariableReferences(css: StylesheetCSS, references: Set<string>) {
  const insert = (name: string, visited = new Set<string>()) => {
    if (visited.has(name)) return
    visited.add(name)
    const variable = css.variables.get(name)
    if (!variable || variable.inline) return
    if (css.themeLayer.get(name) || css.isEmittedGlobalsVariable(name)) {
      const count = css.themeLayer.tokenCounts.get(name) || 0
      css.themeLayer.tokenCounts.set(name, count + 1)
    } else {
      css.themeLayer.insert(new VariableRule(name, variable, css))
      css.themeLayer.tokenCounts.set(name, 1)
    }
    variable.dependencies?.forEach((dependency) => insert(dependency, visited))
  }
  const visited = new Set<string>()
  for (const name of references) {
    insert(name, visited)
  }
}

function collectCSSAnimationReferences(source: string, css: StylesheetCSS, ignoredAnimationNames = new Set<string>()) {
  const references = new Set<string>()
  const animationNames = Array.from(css.animations.keys())
  if (!animationNames.length) return references
  for (const match of source.matchAll(/\b(animation(?:-name)?)\s*:\s*([^;{}]+)/g)) {
    for (const name of collectAnimationNamesFromDeclaration(match[1], match[2], {
      animationNames,
      variables: css.variables,
      variableNames: collectCSSVariableReferences(match[2])
    })) {
      if (ignoredAnimationNames.has(name)) continue
      references.add(name)
    }
  }
  return references
}

function collectNativeCSSAnimationReferences(nativeCSS: string[], css: StylesheetCSS, ignoredAnimationNames = new Set<string>()) {
  const references = new Set<string>()
  for (const source of nativeCSS) {
    for (const reference of collectCSSAnimationReferences(source, css, ignoredAnimationNames)) {
      references.add(reference)
    }
  }
  return references
}

function insertAnimationReferences(css: StylesheetCSS, references: Set<string>) {
  for (const name of references) {
    const keyframes = css.animations.get(name)
    if (!keyframes) continue
    let rule = css.animationsNonLayer.rules.find((eachRule) => eachRule.name === name) as AnimationRule | undefined
    if (rule || css.isEmittedGlobalsAnimation(name)) {
      const count = css.animationsNonLayer.tokenCounts.get(name) || 0
      css.animationsNonLayer.tokenCounts.set(name, count + 1)
    } else {
      rule = new AnimationRule(name, keyframes, css)
      css.animationsNonLayer.insert(rule)
      css.animationsNonLayer.tokenCounts.set(name, 1)
    }
    if (rule) insertVariableReferences(css, rule.variableNames ?? new Set())
  }
}

function createEmptyEmittedGlobals(): Required<MasterCSSEmittedGlobals> {
  return {
    variables: {},
    animations: {}
  }
}

function createEmittedGlobals(css: StylesheetCSS): Required<MasterCSSEmittedGlobals> {
  const emittedGlobals: Required<MasterCSSEmittedGlobals> = {
    variables: { ...css.emittedGlobals.variables },
    animations: { ...css.emittedGlobals.animations }
  }
  for (const rule of css.themeLayer.rules) {
    if (rule instanceof VariableRule) {
      emittedGlobals.variables[rule.name] = 1
    }
  }
  for (const rule of css.animationsNonLayer.rules) {
    if (rule instanceof AnimationRule) {
      emittedGlobals.animations[rule.name] = 1
    }
  }
  return emittedGlobals
}

export function renderCompiledManifestCSS(options: RenderCompiledManifestCSSOptions): RenderCompiledManifestCSSResult {
  const {
    manifest,
    classNames = [],
    includeGeneratedCSS = true,
    emittedGlobals
  } = options
  const nativeCSS = normalizeNativeCSS(options.nativeCSS)
  const nativeAnimationNames = collectStyleCSSKeyframeNames(nativeCSS)
  const css = createCSSWithNativeDeclarations(manifest, emittedGlobals)
  if (nativeAnimationNames.size) {
    css.registerEmittedGlobals({
      animations: Object.fromEntries([...nativeAnimationNames].map((name) => [name, 1]))
    })
  }
  if (includeGeneratedCSS) {
    for (const className of classNames) {
      css.ensureClassRules(className)
    }
  }
  const variableReferences = collectStyleCSSVariableReferences(nativeCSS)
  const animationReferences = collectNativeCSSAnimationReferences(nativeCSS, css, nativeAnimationNames)
  insertVariableReferences(css, variableReferences)
  insertAnimationReferences(css, animationReferences)

  const generatedCSSText = css.text
  const shouldIncludeGeneratedCSS = includeGeneratedCSS
    || variableReferences.size
    || animationReferences.size
    || Boolean(generatedCSSText)
  const generatedCSS = shouldIncludeGeneratedCSS ? generatedCSSText : ''

  return {
    css: [
      ...nativeCSS,
      generatedCSS
    ].filter(Boolean).join('\n\n'),
    nativeCSS: nativeCSS.join('\n\n'),
    generatedCSS,
    emittedGlobals: shouldIncludeGeneratedCSS || nativeAnimationNames.size
      ? createEmittedGlobals(css)
      : createEmptyEmittedGlobals()
  }
}
