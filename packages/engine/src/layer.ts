import { Rule } from './rule'
import MasterCSS from './core'
import VariableRule from './variable-rule'

type RuleHost = { rules: (Rule | VariableRule)[] }

const ruleMaps = new WeakMap<RuleHost, Map<string, Rule | VariableRule>>()

function getRuleMap(layer: RuleHost) {
  let ruleMap = ruleMaps.get(layer)
  if (!ruleMap) {
    ruleMap = new Map<string, Rule | VariableRule>()
    ruleMaps.set(layer, ruleMap)
  }
  return ruleMap
}

function syncRuleMap(layer: RuleHost) {
  const ruleMap = getRuleMap(layer)
  if (ruleMap.size !== layer.rules.length) {
    ruleMap.clear()
    for (const rule of layer.rules) {
      ruleMap.set(rule.key, rule)
    }
  }
  return ruleMap
}

export default class Layer {
  readonly rules: (Rule | VariableRule)[] = []
  readonly tokenCounts = new Map<string, number>()

  constructor(
    public name: string,
    public css: MasterCSS
  ) { }

  attach() {
    this.css.rules.push(this)
  }

  detach() {
    this.css.rules.splice(this.css.rules.indexOf(this), 1)
  }

  get(key: string) {
    return syncRuleMap(this).get(key)
  }

  insert(rule: Rule | VariableRule, index = this.rules.length) {
    const ruleMap = syncRuleMap(this)
    if (ruleMap.has(rule.key)) return
    this.rules.splice(index as number, 0, rule)
    ruleMap.set(rule.key, rule)
    // should attach after inserting, because this.text is possibly empty
    if (!this.css.rules.includes(this)) {
      this.attach()
    }
    return index
  }

  delete(key: string) {
    const ruleMap = syncRuleMap(this)
    const deletedRule = ruleMap.get(key)
    if (!deletedRule) return
    const index = this.rules.indexOf(deletedRule)
    if (index === -1) return
    this.rules.splice(index, 1)
    ruleMap.delete(key)
    if (this.rules.length === 0) {
      this.detach()
    }
    return deletedRule
  }

  reset() {
    this.rules.length = 0
    const indexOfLayer = this.css.rules.indexOf(this)
    if (indexOfLayer !== -1) {
      this.css.rules.splice(indexOfLayer, 1)
    }
    this.tokenCounts.clear()
    getRuleMap(this).clear()
  }

  get text(): string {
    const ruleText = this.rules.map(({ text }) => text).join('')
    if (!ruleText) return ''
    return '@layer ' + this.name + '{' + ruleText + '}'
  }
}
