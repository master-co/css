import { Rule } from './rule'
import MasterCSS from './core'

export default class Layer {
    readonly rules: Rule[] = []
    readonly usages: Record<string, number> = {}

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

    insert(rule: Rule, index = this.rules.length) {
        if (this.rules.find((({ key }) => key === rule.key))) return
        if (!this.css.rules.includes(this)) {
            this.attach()
        }
        this.rules.splice(index as number, 0, rule)
        return index
    }

    delete(key: string) {
        const rule = this.rules.find((rule) => (rule as Rule).key === key)
        if (!rule) return
        if (this.rules.length === 1) {
            this.detach()
        }
        this.rules.splice(this.rules.indexOf(rule), 1)
        return rule
    }

    reset() {
        this.rules.length = 0
        const indexOfLayer = this.css.rules.indexOf(this)
        if (indexOfLayer !== -1) {
            this.css.rules.splice(indexOfLayer, 1)
        }
        // @ts-expect-error
        this.usages = {}
    }

    get text(): string {
        return '@layer ' + this.name + '{' + this.rules.map(({ text }) => text).join('') + '}'
    }
}