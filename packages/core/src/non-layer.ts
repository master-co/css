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
            for (let i = 0; i < rule.nodes.length;) {
                try {
                    const nativeRule = rule.nodes[i]
                    const insertedIndex = sheet.insertRule(nativeRule.text, sheet.cssRules.length)
                    nativeRule.native = sheet.cssRules[insertedIndex]
                    i++
                } catch (error) {
                    console.error(error)
                    rule.nodes.splice(i, 1)
                }
            }
        }
        this.rules.push(rule)
        this.css.rules.push(rule)
    }

    delete(key: string) {
        const rule = this.rules.find((rule) => (rule as Rule).key === key)
        if (!rule) return
        const sheet = this.css.style?.sheet
        if (sheet) {
            for (const node of rule.nodes) {
                const foundIndex = findNativeCSSRuleIndex(sheet.cssRules, node.native!)
                if (foundIndex !== -1) {
                    sheet.deleteRule(foundIndex)
                }
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