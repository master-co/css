import MasterCSS from './core'
import type { ResolvedVariableValue, Variable } from '@master/css-schema/css-syntax'
import { normalizeVariableValue, replaceCSSVariableReferences } from './utils/css-variables'

export default class VariableRule {
  nodes: VariableRuleNode[] = []

  constructor(
    public readonly name: string,
    public readonly variable: Variable,
    public readonly css: MasterCSS,
  ) {
    const hasDefaultValue = variable.value !== undefined
    if (hasDefaultValue) {
      this.nodes.push(new VariableRuleNode(this, variable as ResolvedVariableValue, css))
    }
    if (variable.modes && this.css.settings.modeTrigger) {
      for (const mode in variable.modes) {
        const modeVariable = variable.modes[mode]
        const variableRule = new VariableRuleNode(this, modeVariable, css, mode)
        const isDefaultMode = hasDefaultValue
          ? false
          : this.css.settings.defaultMode !== 'none' && this.css.settings.defaultMode === mode
        variableRule.isDefaultMode = isDefaultMode
        if (isDefaultMode) {
          this.nodes.unshift(variableRule)
        } else {
          this.nodes.push(variableRule)
        }
      }
    }
  }

  get key() {
    return this.name
  }

  get text(): string {
    return this.nodes.map(({ text }) => text).join('')
  }
}

export class VariableRuleNode {
  native?: CSSRule
  isDefaultMode = false

  constructor(
    public readonly rule: VariableRule,
    public readonly variable: ResolvedVariableValue,
    public readonly css: MasterCSS,
    public readonly mode?: string,
  ) { }

  get selectorText(): string {
    const isDefaultMode = this.isDefaultMode
    if (this.mode) {
      switch (this.css.settings.modeTrigger) {
        case 'host':
          return `:host(.${this.mode})${isDefaultMode ? ',:host' : ''}`
        case 'class':
          return `.${this.mode}${isDefaultMode ? ',:root' : ''}`
        default:
          return ':root'
      }
    } else {
      return ':root'
    }
  }

  get declarationName() {
    return `--${this.rule.name}`
  }

  get declarationValue() {
    const resolveInlineReferences = (value: string | number, stack: string[]): string => {
      return replaceCSSVariableReferences(normalizeVariableValue(value).value, (name) => {
        const variable = this.css.variables.get(name)
        if (!variable?.inline || variable.value === undefined) return
        const stackIndex = stack.indexOf(name)
        if (stackIndex !== -1) {
          throw new Error(`Circular inline variable reference: ${[...stack.slice(stackIndex), name].join(' -> ')}`)
        }
        return resolveInlineReferences(variable.value, [...stack, name])
      })
    }
    return resolveInlineReferences(this.variable.value, [this.rule.name])
  }

  get declarationText() {
    return `${this.declarationName}:${this.declarationValue}`
  }

  get mediaText() {
    return this.css.settings.modeTrigger === 'media' && this.mode
      ? `@media (prefers-color-scheme:${this.mode})`
      : ''
  }

  get text(): string {
    let text = `${this.selectorText}{${this.declarationText}}`
    if (this.css.settings.modeTrigger === 'media' && this.mode) {
      text = `@media (prefers-color-scheme:${this.mode}){${text}}`
    }
    return text
  }
}
