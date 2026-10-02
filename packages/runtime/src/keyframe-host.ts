import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSKeyframeDefinition } from '@master/css-schema/manifest'
import type { MasterCSSRuntimeOptions } from './types'
import NativeStylesheets from './native-stylesheets'

type Parent = CSSStyleSheet | CSSGroupingRule

/** CSSOM placement for the resource identities and native containers from Rust. */
export default class KeyframeHost {
  private readonly containers = new Map<string, CSSGroupingRule>()
  private readonly order = new Map<CSSRule, number>()
  private readonly nativeStylesheets: NativeStylesheets

  constructor(
    private readonly root: Document | ShadowRoot,
    private readonly sheet: () => CSSStyleSheet | undefined,
    private readonly manifest: () => MasterCSSManifest,
    private readonly slots: () => readonly string[],
    private readonly stylesheets?: MasterCSSRuntimeOptions['stylesheets'],
    private readonly delivery?: MasterCSSRuntimeOptions['stylesheetDelivery'],
    changed: () => void = () => {}
  ) { this.nativeStylesheets = new NativeStylesheets(root, delivery, changed) }

  dispose() { this.nativeStylesheets.dispose() }
  reconcileOwners() { if (!this.stylesheets) this.nativeStylesheets.sheets() }

  reset() {
    this.containers.clear()
    this.order.clear()
  }

  private definition(id: string) {
    return this.manifest().keyframes?.find(definition => definition.id === id)
  }

  private allSlots(id: string, sheets: readonly CSSStyleSheet[]) {
    const matches: CSSMediaRule[] = []
    const walk = (parent: Parent) => {
      let rules: CSSRuleList
      try { rules = parent.cssRules } catch { return }
      for (const rule of rules) {
        if (rule.constructor.name === 'CSSMediaRule'
          && (rule as CSSMediaRule).conditionText.includes(`(master-css-keyframe-${id})`)) {
          matches.push(rule as CSSMediaRule)
        } else if ('cssRules' in rule) {
          walk(rule as CSSGroupingRule)
        } else if (rule.constructor.name === 'CSSImportRule') {
          const imported = (rule as CSSImportRule).styleSheet
          if (imported) walk(imported)
        }
      }
    }
    for (const sheet of sheets) walk(sheet)
    return matches
  }

  private nativeSlot(definition: MasterCSSKeyframeDefinition) {
    if (!this.slots().includes(definition.id)) return undefined
    const sheets = this.stylesheets
      ? this.stylesheets().filter(binding => definition.ownerId && binding.ownerIds.includes(definition.ownerId)).map(binding => binding.sheet)
      : this.nativeStylesheets.sheets()
    return this.allSlots(definition.slotId || definition.id, sheets)[definition.occurrence || 0]
  }

  private insertionIndex(parent: Parent, order: number) {
    const next = [...parent.cssRules].findIndex(rule => (this.order.get(rule) ?? -1) > order)
    return next < 0 ? parent.cssRules.length : next
  }

  private generatedParent(definition: MasterCSSKeyframeDefinition, order: number): Parent | undefined {
    let parent: Parent | undefined = this.sheet()
    if (!parent) return
    for (const container of definition.containers || []) {
      let native = this.containers.get(container.id)
      if (!native) {
        const index = parent.insertRule(`${container.prelude}{}`, this.insertionIndex(parent, order))
        native = parent.cssRules[index] as CSSGroupingRule
        this.containers.set(container.id, native)
        this.order.set(native, order)
      }
      parent = native
    }
    return parent
  }

  private resourceText(definition: MasterCSSKeyframeDefinition, text: string): string | undefined {
    const id = definition.id
    const anchored = this.slots().includes(id)
    if (definition.resources?.length) {
      const resourceSlot = anchored ? this.nativeSlot(definition) : this.allSlots(`resource-${definition.slotId || definition.id}`, this.stylesheets
        ? this.stylesheets().filter(binding => definition.ownerId && binding.ownerIds.includes(definition.ownerId)).map(binding => binding.sheet)
        : this.nativeStylesheets.sheets())[0]
      // Resource-only slots may arrive after startup, just like native anchors.
      if (!resourceSlot && (this.delivery || this.stylesheets)) return
      const values = (resourceSlot?.cssRules[0] as CSSStyleRule | undefined)?.style
      let cursor = 0
      let resolved = ''
      for (const [index, resource] of definition.resources.entries()) {
        const value = values?.getPropertyValue(`--master-css-keyframe-resource-${index}`)
        if (!value && resourceSlot) throw new Error(`Missing native resource ${index} for keyframe ${id}. Recompile the stylesheet.`)
        resolved += text.slice(cursor, resource.start) + (value?.trim() || resource.value)
        cursor = resource.end
      }
      text = resolved + text.slice(cursor)
    }
    return text
  }

  /** Normalize only compiler-provided URL ranges before comparing SSR CSSOM. */
  rebaseSnapshot(sheet: CSSStyleSheet, resources: readonly { id: string; name: string; text: string; anchored?: boolean }[]) {
    const frames: CSSKeyframesRule[] = []
    const walk = (parent: Parent) => {
      for (const rule of parent.cssRules) {
        if (rule.constructor.name === 'CSSKeyframesRule' || rule.constructor.name === 'WebKitCSSKeyframesRule') frames.push(rule as CSSKeyframesRule)
        else if ('cssRules' in rule) walk(rule as CSSGroupingRule)
      }
    }
    walk(sheet)
    const standalone = resources.filter(resource => !resource.anchored)
    for (const [index, resource] of standalone.entries()) {
      const definition = this.definition(resource.id)
      if (!definition?.resources?.length) continue
      const native = frames[index]
      const text = this.resourceText(definition, resource.text)
      if (!native || native.name !== resource.name || text === undefined) return false
      const parent = (native.parentRule || native.parentStyleSheet) as Parent
      const position = [...parent.cssRules].indexOf(native)
      parent.deleteRule(position)
      parent.insertRule(text, position)
    }
    return true
  }

  insert(id: string, text: string): CSSRule | undefined {
    const definition = this.definition(id)
    if (!definition) return
    const order = this.manifest().keyframes!.indexOf(definition)
    const anchored = this.slots().includes(id)
    const parent = anchored ? this.nativeSlot(definition) : this.generatedParent(definition, order)
    // A host can attach an imported stylesheet after runtime startup. Keep the
    // Rust resource alive and retry placement when that stylesheet arrives.
    if (!parent) return
    const resolved = this.resourceText(definition, text)
    if (resolved === undefined) return
    text = resolved
    const index = parent.insertRule(text, this.insertionIndex(parent, order))
    const native = parent.cssRules[index]
    this.order.set(native, order)
    return native
  }

  contains(id: string, native: CSSRule | undefined) {
    if (!native) return false
    const definition = this.definition(id)
    if (!definition) return false
    const parent = (native.parentRule || native.parentStyleSheet) as Parent | null
    if (!parent || ![...parent.cssRules].includes(native)) return false
    if (this.slots().includes(id)) return parent === this.nativeSlot(definition)
    return native.parentStyleSheet === this.sheet()
  }

  remove(native: CSSRule | undefined) {
    if (!native) return
    const parent = (native.parentRule || native.parentStyleSheet) as Parent | null
    if (!parent) return
    const index = [...parent.cssRules].indexOf(native)
    if (index >= 0) parent.deleteRule(index)
    this.order.delete(native)
  }

  adopt(id: string, claimed: Set<CSSRule>) {
    const definition = this.definition(id)
    if (!definition) return
    const owner = this.slots().includes(id) ? this.nativeSlot(definition) : this.sheet()
    if (!owner) return
    const candidates: CSSKeyframesRule[] = []
    const walk = (parent: Parent) => {
      for (const rule of parent.cssRules) {
        if (rule.constructor.name === 'CSSKeyframesRule' || rule.constructor.name === 'WebKitCSSKeyframesRule') {
          if ((rule as CSSKeyframesRule).name === definition.name && !claimed.has(rule)) candidates.push(rule as CSSKeyframesRule)
        } else if ('cssRules' in rule) walk(rule as CSSGroupingRule)
      }
    }
    walk(owner)
    const native = candidates[0]
    if (!native) return
    claimed.add(native)
    const order = this.manifest().keyframes!.indexOf(definition)
    this.order.set(native, order)
    if (!this.slots().includes(id)) {
      let parent = native.parentRule
      for (const container of [...(definition.containers || [])].reverse()) {
        if (!parent || !('cssRules' in parent)) break
        this.containers.set(container.id, parent as CSSGroupingRule)
        this.order.set(parent, order)
        parent = parent.parentRule
      }
    }
    return native
  }
}
