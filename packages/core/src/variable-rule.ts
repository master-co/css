import MasterCSS from './core'
import { ResolvedVariableValue, Variable } from './types/syntax'
import { normalizeVariableValue } from './utils/css-variables'

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
        if (variable.modes && this.css.config.modeTrigger) {
            for (const mode in variable.modes) {
                const modeVariable = variable.modes[mode]
                const variableRule = new VariableRuleNode(this, modeVariable, css, mode)
                const isDefaultMode = hasDefaultValue ? false : this.css.config.defaultMode === mode
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
            switch (this.css.config.modeTrigger) {
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
        return normalizeVariableValue(this.variable.value).value
    }

    get declarationText() {
        return `${this.declarationName}:${this.declarationValue}`
    }

    get mediaText() {
        return this.css.config.modeTrigger === 'media' && this.mode
            ? `@media (prefers-color-scheme:${this.mode})`
            : ''
    }

    get text(): string {
        let text = `${this.selectorText}{${this.declarationText}}`
        if (this.css.config.modeTrigger === 'media' && this.mode) {
            text = `@media (prefers-color-scheme:${this.mode}){${text}}`
        }
        return text
    }
}
