import type { MasterCSSKeyframeDefinition } from '@master/css-schema/manifest'

type Parent = CSSStyleSheet | CSSGroupingRule

const isKeyframesRule = (rule: CSSRule): rule is CSSKeyframesRule =>
  rule.constructor.name === 'CSSKeyframesRule' || rule.constructor.name === 'WebKitCSSKeyframesRule'

/**
 * Places the keyframes the engine emits in the runtime stylesheet, after its layers
 * and wrapped in the containers each definition was declared in.
 */
export default class KeyframeHost {
  private readonly containers = new Map<string, CSSGroupingRule>()
  private readonly order = new Map<CSSRule, number>()

  constructor(
    private readonly sheet: () => CSSStyleSheet | undefined,
    /** The engine's definitions, deduplicated by ID, in program order. */
    private readonly definitions: () => readonly MasterCSSKeyframeDefinition[]
  ) {}

  reset() {
    this.containers.clear()
    this.order.clear()
  }

  private definition(id: string) {
    return this.definitions().find(definition => definition.id === id)
  }

  private insertionIndex(parent: Parent, order: number) {
    const next = [...parent.cssRules].findIndex(rule => (this.order.get(rule) ?? -1) > order)
    return next < 0 ? parent.cssRules.length : next
  }

  private parent(definition: MasterCSSKeyframeDefinition, order: number): Parent | undefined {
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

  insert(id: string, text: string): CSSRule | undefined {
    const definition = this.definition(id)
    if (!definition) return
    const order = this.definitions().indexOf(definition)
    const parent = this.parent(definition, order)
    if (!parent) return
    const index = parent.insertRule(text, this.insertionIndex(parent, order))
    const native = parent.cssRules[index]
    this.order.set(native, order)
    return native
  }

  contains(native: CSSRule | undefined) {
    if (!native || native.parentStyleSheet !== this.sheet()) return false
    const parent = (native.parentRule || native.parentStyleSheet) as Parent | null
    return !!parent && [...parent.cssRules].includes(native)
  }

  remove(native: CSSRule | undefined) {
    if (!native) return
    const parent = (native.parentRule || native.parentStyleSheet) as Parent | null
    if (!parent) return
    const index = [...parent.cssRules].indexOf(native)
    if (index >= 0) parent.deleteRule(index)
    this.order.delete(native)
  }

  /** Claims the pre-rendered rule of `id`, with its containers, from the runtime stylesheet. */
  adopt(id: string, claimed: Set<CSSRule>) {
    const definition = this.definition(id)
    const sheet = this.sheet()
    if (!definition || !sheet) return
    const candidates: CSSKeyframesRule[] = []
    const walk = (parent: Parent) => {
      for (const rule of parent.cssRules) {
        if (isKeyframesRule(rule)) {
          if (rule.name === definition.name && !claimed.has(rule)) candidates.push(rule)
        } else if ('cssRules' in rule) walk(rule as CSSGroupingRule)
      }
    }
    walk(sheet)
    const native = candidates[0]
    if (!native) return
    claimed.add(native)
    const order = this.definitions().indexOf(definition)
    this.order.set(native, order)
    let parent = native.parentRule
    for (const container of [...(definition.containers || [])].reverse()) {
      if (!parent || !('cssRules' in parent)) break
      this.containers.set(container.id, parent as CSSGroupingRule)
      this.order.set(parent, order)
      parent = parent.parentRule
    }
    return native
  }
}
