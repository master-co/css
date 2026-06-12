import findNativeCSSRuleIndex from 'shared/utils/find-native-css-rule-index'
import MasterCSS from './core'
import { Rule } from './rule'

export default class NonLayer {
    readonly rules: Rule[] = []
    readonly tokenCounts = new Map<string, number>()

    constructor(
        public css: MasterCSS
    ) { }

    insert(rule: Rule) {
        if (this.rules.includes(rule)) return
        const sheet = this.css.style?.sheet
        if (sheet) {
            try {
                const insertedIndex = sheet.insertRule(rule.text, sheet.cssRules.length)
                rule.native = sheet.cssRules[insertedIndex]
            } catch (error) {
                console.error(error)
            }
        }
        this.rules.push(rule)
        this.css.rules.push(rule)
    }

    delete(name: string) {
        const rule = this.rules.find((rule) => (rule as Rule).name === name)
        if (!rule) return
        const sheet = this.css.style?.sheet
        if (sheet) {
            const foundIndex = findNativeCSSRuleIndex(sheet.cssRules, rule.native!)
            if (foundIndex !== -1) {
                sheet.deleteRule(foundIndex)
            }
        }
        this.rules.splice(this.rules.indexOf(rule), 1)
        this.css.rules.splice(this.css.rules.indexOf(rule), 1)
        return rule
    }

    get text(): string {
        return this.rules.map(({ text }) => text).join('')
    }

    reset() {
        for (const rule of this.rules) {
            const foundIndex = this.css.rules.indexOf(rule)
            if (foundIndex !== -1) {
                this.css.rules.splice(foundIndex, 1)
            }
        }
        this.rules.length = 0
        this.tokenCounts.clear()
    }
}