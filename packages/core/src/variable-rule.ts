import MasterCSS from './core'
import { ColorVariable, LiteralVariable, NumberVariable, StringVariable, Variable } from './types/syntax'

export default class VariableRule {
    nodes: VariableRuleNode[] = []

    constructor(
        public readonly name: string,
        public readonly variable: Variable,
        public readonly css: MasterCSS,
    ) {
        const hasDefaultValue = variable.value !== undefined
        if (hasDefaultValue) {
            this.nodes.push(new VariableRuleNode(this, variable, css))
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

type VariableMap = {
    string: StringVariable
    number: NumberVariable
    color: ColorVariable
}

type VariableType = LiteralVariable['type']

export class VariableRuleNode<T extends VariableType = VariableType> {
    native?: CSSRule
    isDefaultMode = false

    constructor(
        public readonly rule: VariableRule & { variable: VariableMap[T] },
        public readonly variable: VariableMap[T],
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

    get text(): string {
        let value = ''
        switch (this.rule.variable.type) {
            case 'color': {
                const color = this.variable as ColorVariable
                value = (color.alpha ?? 1) < 1
                    ? `${color.space}(${color.value}/${color.alpha})`
                    : `${color.space}(${color.value})`
                break
            }
            case 'number':
                value = String((this.variable as NumberVariable).value)
                break
            case 'string':
                value = (this.variable as StringVariable).value
                break
        }

        let text = `${this.selectorText}{--${this.rule.name}:${value}}`
        if (this.css.config.modeTrigger === 'media' && this.mode) {
            text = `@media (prefers-color-scheme:${this.mode}){${text}}`
        }
        return text
    }
}
