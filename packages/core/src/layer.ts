import { Rule } from './rule'
import MasterCSS from './core'
import VariableRule from './variable-rule'

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

    insert(rule: Rule | VariableRule, index = this.rules.length) {
        if (this.rules.find((({ key }) => key === rule.key))) return
        this.rules.splice(index as number, 0, rule)
        // should attach after inserting, because this.text is possibly empty
        if (!this.css.rules.includes(this)) {
            this.attach()
        }
        return index
    }

    delete(key: string) {
        const index = this.rules.findIndex((rule) => (rule as Rule).key === key)
        if (index === -1) return
        const deletedRule = this.rules[index]
        this.rules.splice(index, 1)
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
    }

    get text(): string {
        const ruleText = this.rules.map(({ text }) => text).join('')
        if (!ruleText) return ''
        return '@layer ' + this.name + '{' + ruleText + '}'
    }
}