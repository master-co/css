import type HydratedGeneratedRule from './generated-rule'

export interface RuntimeResourceRule {
  readonly key: string
  readonly name: string
  readonly text: string
  native?: CSSRule
}

export type RuntimeLayerRule = HydratedGeneratedRule | RuntimeResourceRule

export function getRuleNodeCount(rule: RuntimeLayerRule) {
  return 'nodeCount' in rule ? rule.nodeCount : 1
}

type MutateNativeRule = (layer: RuntimeLayer, rule: RuntimeLayerRule, nativeIndex: number) => void

export default class RuntimeLayer {
  readonly rules: RuntimeLayerRule[] = []
  readonly tokenCounts = new Map<string, number>()
  private readonly byKey = new Map<string, RuntimeLayerRule>()
  private offsets: number[] | undefined
  private nodeCount = 0
  native: CSSLayerBlockRule | null = null

  constructor(
    public readonly name: string,
    private readonly insertRule: MutateNativeRule,
    private readonly deleteRule: MutateNativeRule
  ) { }

  get text() {
    return this.rules.length
      ? `@layer ${this.name}{${this.rules.map(({ text }) => text).join('')}}`
      : ''
  }

  get(key: string) {
    return this.byKey.get(key)
  }

  /** Single-node layers and tail operations need no prefix traversal. */
  nativeIndex(index: number) {
    return index === this.rules.length ? this.nodeCount : this.offsets?.[index] ?? index
  }

  private track(rule: RuntimeLayerRule, index: number) {
    const count = getRuleNodeCount(rule)
    const nativeIndex = this.nativeIndex(index)
    if (count > 1) {
      this.offsets ??= Array.from({ length: this.rules.length }, (_, index) => index)
    }
    if (this.offsets) {
      this.offsets.splice(index, 0, nativeIndex)
      for (let next = index + 1; next < this.offsets.length; next++) {
        this.offsets[next] += count
      }
    }
    this.nodeCount += count
    this.rules.splice(index, 0, rule)
    this.byKey.set(rule.key, rule)
    return nativeIndex
  }

  /** Track an already hydrated rule without mutating the stylesheet. */
  adopt(rule: RuntimeLayerRule) {
    if (!this.byKey.has(rule.key)) this.track(rule, this.rules.length)
  }

  insert(rule: RuntimeLayerRule, index = this.rules.length) {
    if (this.byKey.has(rule.key)) return
    const boundedIndex = Math.max(0, Math.min(index, this.rules.length))
    const nativeIndex = this.track(rule, boundedIndex)
    this.insertRule(this, rule, nativeIndex)
    return boundedIndex
  }

  delete(key: string, index?: number) {
    const rule = this.byKey.get(key)
    if (!rule) return
    const foundIndex = index !== undefined && this.rules[index] === rule
      ? index
      : this.rules.indexOf(rule)
    const nativeIndex = this.nativeIndex(foundIndex)
    const count = getRuleNodeCount(rule)
    this.rules.splice(foundIndex, 1)
    this.byKey.delete(key)
    this.nodeCount -= count
    if (this.nodeCount === this.rules.length) this.offsets = undefined
    if (this.offsets) {
      this.offsets.splice(foundIndex, 1)
      for (let next = foundIndex; next < this.offsets.length; next++) {
        this.offsets[next] -= count
      }
    }
    this.deleteRule(this, rule, nativeIndex)
    return rule
  }

  clearRules() {
    this.rules.length = 0
    this.byKey.clear()
    this.offsets = undefined
    this.nodeCount = 0
  }

  reset() {
    this.clearRules()
    this.tokenCounts.clear()
    this.native = null
  }
}
