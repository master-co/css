import MasterCSS from './core'
import { LiteralVariable, Variable } from './types/syntax'

export default class VariableRule {
    nodes: VariableRuleNode[] = []

    constructor(
        public readonly name: string,
        public readonly variable: Variable,
        public readonly css: MasterCSS,
    ) {
        const hasDefaultValue = variable.value !== undefined
        if (hasDefaultValue) {
            this.nodes.push(new VariableRuleNode(this.name, variable, css))
        }
        if (variable.modes) {
            for (const mode in variable.modes) {
                const modeVariable = variable.modes[mode]
                const variableRule = new VariableRuleNode(this.name, modeVariable, css, mode)
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
        public readonly name: string,
        public readonly variable: LiteralVariable,
        public readonly css: MasterCSS,
        public readonly mode?: string,
    ) { }

    get selectorText(): string {
        const isDefaultMode = this.isDefaultMode
        if (this.mode) {
            switch (this.css.config.modeTrigger) {
                case 'host':
                    return `:host(.${this.mode})` + (isDefaultMode ? ',:host' : '')
                case 'class':
                    return `.${this.mode}` + (isDefaultMode ? ',:root' : '')
                default:
                    // media
                    return ':root'
            }
        } else {
            return ':root'
        }
    }

    get text(): string {
        let text = `${this.selectorText}{--${this.name}:${String(this.variable.value)}}`
        if (this.css.config.modeTrigger === 'media') {
            text = `@media (prefers-color-scheme:${this.mode}){${text}}`
        }
        return text
    }
}