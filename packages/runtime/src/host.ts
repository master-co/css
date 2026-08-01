import type {
  MasterCSSEngine,
  MasterCSSEngineResources,
  MasterCSSEngineSnapshot,
  MasterCSSEngineTransition
} from '@master/css'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import { MasterCSSError } from '@master/css-schema'
import {
  flattenMasterCSSManifestVariables,
  type MasterCSSManifest,
  type MasterCSSManifestUtilityLayerName,
  type MasterCSSManifestVariableEntry
} from '@master/css-schema/manifest'
import type { MasterCSSHydrationManifest } from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import HydratedGeneratedRule from './generated-rule'
import RuntimeLayer, { type RuntimeLayerRule, type RuntimeResourceRule } from './layer'
import RuntimeThemeLayer from './theme-layer'
import RuntimeUtilityLayer from './utility-layer'
import { isDocumentRoot } from './hydration'

export const LAYER_ORDER = ['theme', 'base', 'defaults', 'components', 'utilities'] as const

interface RuntimeKeyframeRule extends RuntimeResourceRule {
  native?: CSSKeyframesRule
}

interface RuntimeNonLayer {
  rules: RuntimeKeyframeRule[]
  tokenCounts: Map<string, number>
}

export function isLayerBlockRule(rule: CSSRule): rule is CSSLayerBlockRule {
  return rule.constructor.name === 'CSSLayerBlockRule'
}

function isKeyframesRule(rule: CSSRule): rule is CSSKeyframesRule {
  return rule.constructor.name === 'CSSKeyframesRule'
}

export function getGeneratedRuleNodeTexts(rule: RuntimeLayerRule) {
  const nodes = 'nodes' in rule ? rule.nodes : undefined
  return nodes?.length ? nodes.map(({ text }) => text) : [rule.text]
}

function cloneEmittedGlobals(emittedGlobals?: MasterCSSEmittedGlobals): Required<MasterCSSEmittedGlobals> {
  return {
    variables: { ...(emittedGlobals?.variables || {}) },
    animations: { ...(emittedGlobals?.animations || {}) }
  }
}

function addEmittedGlobals(
  target: Required<MasterCSSEmittedGlobals>,
  source: MasterCSSEmittedGlobals
) {
  for (const kind of ['variables', 'animations'] as const) {
    for (const [name, count] of Object.entries(source[kind] || {})) {
      if (count) {
        target[kind][name] = Math.min(
          0xffff_ffff,
          (target[kind][name] || 0) + count
        )
      }
    }
  }
}

export default class RuntimeHost {
  protected readonly host: Element
  protected readonly container: HTMLElement | ShadowRoot
  private readonly insertRuntimeLayerRule = (
    layer: RuntimeLayer,
    rule: RuntimeLayerRule,
    index: number
  ) => this.insertLayerRule(layer, rule, index)
  private readonly deleteRuntimeLayerRule = (
    layer: RuntimeLayer,
    rule: RuntimeLayerRule,
    index: number
  ) => this.deleteLayerRule(layer, rule, index)
  protected readonly baseLayer = new RuntimeUtilityLayer('base', this.insertRuntimeLayerRule, this.deleteRuntimeLayerRule)
  protected readonly themeLayer = new RuntimeThemeLayer('theme', this.insertRuntimeLayerRule, this.deleteRuntimeLayerRule)
  protected readonly defaultsLayer = new RuntimeUtilityLayer('defaults', this.insertRuntimeLayerRule, this.deleteRuntimeLayerRule)
  protected readonly componentsLayer = new RuntimeUtilityLayer('components', this.insertRuntimeLayerRule, this.deleteRuntimeLayerRule)
  protected readonly utilitiesLayer = new RuntimeUtilityLayer('utilities', this.insertRuntimeLayerRule, this.deleteRuntimeLayerRule)
  protected readonly classUtilities = new Map<string, HydratedGeneratedRule[]>()
  protected readonly animationsNonLayer: RuntimeNonLayer = { rules: [], tokenCounts: new Map() }
  protected readonly emittedGlobals: Required<MasterCSSEmittedGlobals>
  private readonly variables = new Map<string, MasterCSSManifestVariableEntry>()
  private readonly animations = new Map<string, unknown>()

  protected manifest: MasterCSSManifest
  protected style: HTMLStyleElement | null = null
  protected progressive = false
  protected hydrationFailureReason?: string

  protected get rules() {
    const layers = LAYER_ORDER
      .map((name) => this.getLayerByName(name))
      .filter((layer): layer is RuntimeLayer => Boolean(layer?.text))
    return [...layers, ...this.animationsNonLayer.rules]
  }

  constructor(
    protected readonly root: Document | ShadowRoot,
    manifest: MasterCSSManifest,
    emittedGlobals: MasterCSSEmittedGlobals | undefined,
    protected hydrationManifest: MasterCSSHydrationManifest | undefined,
    protected readonly bindingEngine: MasterCSSEngine
  ) {
    this.manifest = manifest
    this.emittedGlobals = cloneEmittedGlobals(emittedGlobals)
    this.host = isDocumentRoot(root) ? root.documentElement : root.host
    this.container = isDocumentRoot(root) ? root.head : root
    this.loadManifestHostData(manifest)
    this.resetResourceCounts()
  }

  protected loadManifestHostData(manifest: MasterCSSManifest) {
    this.variables.clear()
    for (const variable of flattenMasterCSSManifestVariables(manifest.variables)) {
      this.variables.set(variable.name, variable)
    }
    this.animations.clear()
    for (const [name, animation] of Object.entries(manifest.animations || {})) {
      this.animations.set(name, animation)
    }
  }


  protected registerEmittedGlobals(emittedGlobals?: MasterCSSEmittedGlobals) {
    if (!emittedGlobals) return
    const transition = this.bindingEngine.registerEmittedGlobals(emittedGlobals)
    addEmittedGlobals(this.emittedGlobals, emittedGlobals)
    this.applyTransition(transition)
  }

  protected setHydrationManifest(hydrationManifest?: MasterCSSHydrationManifest): this {
    this.hydrationManifest = hydrationManifest
    return this
  }

  protected getOwnerDocument() {
    return isDocumentRoot(this.root) ? this.root : this.root.ownerDocument
  }

  protected createRuntimeStyle() {
    this.style = this.getOwnerDocument().createElement('style')
    this.style.id = MASTER_CSS_RUNTIME_STYLE_ID
    this.style.setAttribute('blocking', 'render')
    this.container.append(this.style)
  }

  protected getStyleSheet() {
    return this.style?.sheet || undefined
  }

  protected findTopLevelRuleIndex(rule: CSSRule) {
    const sheet = this.getStyleSheet()
    if (!sheet) return -1
    for (let index = 0; index < sheet.cssRules.length; index++) {
      if (sheet.cssRules.item(index) === rule) return index
    }
    return -1
  }

  protected getLayerInsertIndex(name: string) {
    const sheet = this.getStyleSheet()
    if (!sheet) return 0
    const rank = LAYER_ORDER.indexOf(name as typeof LAYER_ORDER[number])
    for (let index = 0; index < sheet.cssRules.length; index++) {
      const rule = sheet.cssRules.item(index)!
      if (isKeyframesRule(rule)) return index
      if (isLayerBlockRule(rule)) {
        const ruleRank = LAYER_ORDER.indexOf(rule.name as typeof LAYER_ORDER[number])
        if (ruleRank > rank) return index
      }
    }
    return sheet.cssRules.length
  }

  protected ensureNativeLayer(layer: RuntimeLayer) {
    const sheet = this.getStyleSheet()
    if (!sheet) return
    if (layer.native?.parentStyleSheet) return layer.native
    const insertedIndex = sheet.insertRule(
      `@layer ${layer.name}{}`,
      this.getLayerInsertIndex(layer.name)
    )
    layer.native = sheet.cssRules.item(insertedIndex) as CSSLayerBlockRule
    return layer.native
  }

  protected insertLayerRule(layer: RuntimeLayer, rule: RuntimeLayerRule, index: number) {
    const nativeLayer = this.ensureNativeLayer(layer)
    if (!nativeLayer) return
    let nativeIndex = 0
    for (let previous = 0; previous < index; previous++) {
      nativeIndex += getGeneratedRuleNodeTexts(layer.rules[previous]).length
    }
    const nodes = 'nodes' in rule ? rule.nodes : undefined
    for (const [nodeIndex, text] of getGeneratedRuleNodeTexts(rule).entries()) {
      try {
        const insertedIndex = nativeLayer.insertRule(text, nativeIndex + nodeIndex)
        const native = nativeLayer.cssRules.item(insertedIndex) || undefined
        if (nodes?.[nodeIndex]) nodes[nodeIndex].native = native
        else rule.native = native
      } catch (error) {
        console.error(error, rule)
      }
    }
  }

  protected deleteLayerRule(layer: RuntimeLayer, rule: RuntimeLayerRule, index: number) {
    const nativeLayer = layer.native
    if (!nativeLayer) return
    let nativeIndex = 0
    for (let previous = 0; previous < index; previous++) {
      nativeIndex += getGeneratedRuleNodeTexts(layer.rules[previous]).length
    }
    for (let count = getGeneratedRuleNodeTexts(rule).length; count > 0; count--) {
      if (nativeIndex < nativeLayer.cssRules.length) nativeLayer.deleteRule(nativeIndex)
    }
    if (!layer.rules.length) {
      const sheet = this.getStyleSheet()
      const topIndex = this.findTopLevelRuleIndex(nativeLayer)
      if (sheet && topIndex !== -1) sheet.deleteRule(topIndex)
      layer.native = null
    }
  }

  protected getLayerByName(name: string): RuntimeLayer | undefined {
    switch (name) {
      case 'theme': return this.themeLayer
      case 'base': return this.baseLayer
      case 'defaults': return this.defaultsLayer
      case 'components': return this.componentsLayer
      case 'utilities': return this.utilitiesLayer
    }
  }

  protected getUtilityLayerByName(name: MasterCSSManifestUtilityLayerName) {
    return this.getLayerByName(name) as RuntimeUtilityLayer
  }

  protected getUtilityLayers() {
    return [this.baseLayer, this.defaultsLayer, this.componentsLayer, this.utilitiesLayer]
  }

  protected setThemeResource(text: string) {
    const sheet = this.getStyleSheet()
    if (sheet && this.themeLayer.native) {
      const index = this.findTopLevelRuleIndex(this.themeLayer.native)
      if (index !== -1) sheet.deleteRule(index)
    }
    this.themeLayer.native = null
    this.themeLayer.resourceText = text
    if (sheet && text) {
      const index = sheet.insertRule(`@layer theme{${text}}`, this.getLayerInsertIndex('theme'))
      this.themeLayer.native = sheet.cssRules.item(index) as CSSLayerBlockRule
    }
  }

  protected insertKeyframes(key: string, text: string, index: number) {
    if (this.animationsNonLayer.rules.some((rule) => rule.key === key)) return
    const rule: RuntimeKeyframeRule = { key, name: key, text }
    const boundedIndex = Math.max(0, Math.min(index, this.animationsNonLayer.rules.length))
    this.animationsNonLayer.rules.splice(boundedIndex, 0, rule)
    const sheet = this.getStyleSheet()
    if (!sheet) return
    let keyframesStartIndex = sheet.cssRules.length
    for (let topIndex = 0; topIndex < sheet.cssRules.length; topIndex++) {
      if (isKeyframesRule(sheet.cssRules.item(topIndex)!)) {
        keyframesStartIndex = topIndex
        break
      }
    }
    const topIndex = keyframesStartIndex + boundedIndex
    const insertedIndex = sheet.insertRule(text, Math.min(topIndex, sheet.cssRules.length))
    rule.native = sheet.cssRules.item(insertedIndex) as CSSKeyframesRule
  }

  protected deleteKeyframes(key: string, index?: number) {
    const foundIndex = index !== undefined && this.animationsNonLayer.rules[index]?.key === key
      ? index
      : this.animationsNonLayer.rules.findIndex((rule) => rule.key === key)
    if (foundIndex === -1) return
    const [rule] = this.animationsNonLayer.rules.splice(foundIndex, 1)
    if (rule.native) {
      const sheet = this.getStyleSheet()
      const topIndex = this.findTopLevelRuleIndex(rule.native)
      if (sheet && topIndex !== -1) sheet.deleteRule(topIndex)
    }
  }

  protected resetHostRuleState() {
    this.classUtilities.clear()
    this.baseLayer.reset()
    this.themeLayer.reset()
    this.defaultsLayer.reset()
    this.componentsLayer.reset()
    this.utilitiesLayer.reset()
    this.animationsNonLayer.rules.length = 0
    this.resetResourceCounts()
  }

  protected resetResourceCounts() {
    this.themeLayer.tokenCounts.clear()
    this.animationsNonLayer.tokenCounts.clear()
    for (const [name, count] of Object.entries(this.emittedGlobals.variables)) {
      if (count) this.themeLayer.tokenCounts.set(name, count)
    }
    for (const [name, count] of Object.entries(this.emittedGlobals.animations)) {
      if (count) this.animationsNonLayer.tokenCounts.set(name, count)
    }
  }

  protected syncResourceSnapshot(resources: MasterCSSEngineResources) {
    this.themeLayer.resourceText = resources.themeText || ''
    this.themeLayer.rules.length = 0
    this.resetResourceCounts()
    for (const { name, refCount } of resources.variables) {
      const rule: RuntimeResourceRule = { key: name, name, text: '' }
      this.themeLayer.rules.push(rule)
      if (refCount) {
        this.themeLayer.tokenCounts.set(
          name,
          (this.themeLayer.tokenCounts.get(name) || 0) + refCount
        )
      }
    }
    for (const { name, refCount } of resources.animations) {
      if (refCount) {
        this.animationsNonLayer.tokenCounts.set(
          name,
          (this.animationsNonLayer.tokenCounts.get(name) || 0) + refCount
        )
      }
    }
  }

  protected registerClassRule(rule: HydratedGeneratedRule) {
    const rules = this.classUtilities.get(rule.name)
    if (rules) rules.push(rule)
    else this.classUtilities.set(rule.name, [rule])
  }

  protected unregisterLayerRule(rule: RuntimeLayerRule) {
    if (!(rule instanceof HydratedGeneratedRule)) return
    for (const [className, rules] of this.classUtilities) {
      const next = rules.filter((candidate) => candidate !== rule)
      if (next.length) this.classUtilities.set(className, next)
      else this.classUtilities.delete(className)
    }
  }

  protected applyTransition(transition: MasterCSSEngineTransition) {
    for (const mutation of transition.mutations) {
      if (mutation.target === 'theme') {
        this.setThemeResource(mutation.op === 'insert' ? mutation.text : '')
        continue
      }
      if (mutation.target === 'keyframes') {
        if (mutation.op === 'insert') this.insertKeyframes(mutation.key, mutation.text, mutation.index)
        else this.deleteKeyframes(mutation.key, mutation.index)
        continue
      }
      const layer = this.getUtilityLayerByName(mutation.target)
      if (mutation.op === 'insert') {
        if (!mutation.rule) {
          throw new MasterCSSError({
            code: 'INTERNAL',
            domain: 'runtime',
            message: `Missing generated rule contract for ${mutation.key}.`
          })
        }
        const rule = new HydratedGeneratedRule(mutation.rule, layer)
        layer.insert(rule, mutation.index)
        this.registerClassRule(rule)
      } else {
        const rule = layer.delete(mutation.key, mutation.index)
        if (rule) this.unregisterLayerRule(rule)
      }
    }
    this.syncResourceSnapshot(this.bindingEngine.snapshot().resources)
  }

  protected adoptSnapshot(snapshot: MasterCSSEngineSnapshot, preserveStyle = false) {
    this.resetHostRuleState()
    if (!this.style) return
    if (!preserveStyle) this.style.textContent = snapshot.text
    const sheet = this.getStyleSheet()
    if (!sheet) return

    const nativeLayers = new Map<string, CSSLayerBlockRule>()
    const nativeKeyframes: CSSKeyframesRule[] = []
    for (const rule of sheet.cssRules) {
      if (isLayerBlockRule(rule)) nativeLayers.set(rule.name, rule)
      else if (isKeyframesRule(rule)) nativeKeyframes.push(rule)
    }
    this.themeLayer.native = nativeLayers.get('theme') || null
    this.themeLayer.resourceText = snapshot.resources.themeText || ''

    const layerNativeIndexes = new Map<string, number>()
    for (const ir of snapshot.rules) {
      const layer = this.getUtilityLayerByName(ir.layer)
      layer.native ||= nativeLayers.get(ir.layer) || null
      const rule = new HydratedGeneratedRule(ir, layer)
      const nativeIndex = layerNativeIndexes.get(ir.layer) || 0
      const nodes = rule.nodes
      if (nodes?.length) {
        for (let index = 0; index < nodes.length; index++) {
          nodes[index].native = layer.native?.cssRules.item(nativeIndex + index) || undefined
        }
      } else {
        rule.native = layer.native?.cssRules.item(nativeIndex) || undefined
      }
      layerNativeIndexes.set(ir.layer, nativeIndex + (nodes?.length || 1))
      layer.rules.push(rule)
      this.registerClassRule(rule)
    }

    const nativeKeyframesByName = new Map(nativeKeyframes.map((native) => [native.name, native]))
    for (const resource of snapshot.resources.animations) {
      const native = nativeKeyframesByName.get(resource.name)
      this.animationsNonLayer.rules.push({
        key: resource.name,
        name: resource.name,
        text: resource.text,
        native
      })
    }
    this.syncResourceSnapshot(snapshot.resources)
  }

}
