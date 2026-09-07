import type HydratedGeneratedRule from './generated-rule'

export interface RuntimeResourceRule {
  readonly key: string
  readonly name: string
  readonly text: string
  native?: CSSRule
}

export type RuntimeLayerRule = HydratedGeneratedRule | RuntimeResourceRule

export default class RuntimeLayer {
  readonly rules: RuntimeLayerRule[] = []
  readonly tokenCounts = new Map<string, number>()
  native: CSSLayerBlockRule | null = null

  constructor(
    public readonly name: string,
    private readonly insertRule: (
      layer: RuntimeLayer,
      rule: RuntimeLayerRule,
      index: number
    ) => void,
    private readonly deleteRule: (
      layer: RuntimeLayer,
      rule: RuntimeLayerRule,
      index: number
    ) => void
  ) { }

  get text() {
    return this.rules.length
      ? `@layer ${this.name}{${this.rules.map(({ text }) => text).join('')}}`
      : ''
  }

  insert(rule: RuntimeLayerRule, index = this.rules.length) {
    if (this.rules.some(({ key }) => key === rule.key)) return
    const boundedIndex = Math.max(0, Math.min(index, this.rules.length))
    this.rules.splice(boundedIndex, 0, rule)
    this.insertRule(this, rule, boundedIndex)
    return boundedIndex
  }

  delete(key: string, index?: number) {
    const foundIndex = index !== undefined && this.rules[index]?.key === key
      ? index
      : this.rules.findIndex((rule) => rule.key === key)
    if (foundIndex === -1) return
    const [rule] = this.rules.splice(foundIndex, 1)
    this.deleteRule(this, rule, foundIndex)
    return rule
  }

  reset() {
    this.rules.length = 0
    this.tokenCounts.clear()
    this.native = null
  }
}
