import { Layer, Rule, VariableRule } from '@master/css'
import findNativeCSSRuleIndex from 'shared/utils/find-native-css-rule-index'
import CSSRuntime from './core'

export default class RuntimeLayer extends Layer {
    readonly rules: Rule[] = []
    readonly tokenCounts = new Map<string, number>()
    native: CSSLayerBlockRule | null = null

    constructor(
        public name: string,
        public cssRuntime: CSSRuntime
    ) {
        super(name, cssRuntime)
    }

    attach() {
        super.attach()
        const nativeSheet = this.cssRuntime.style?.sheet
        if (nativeSheet && !this.native?.parentStyleSheet) {
            const insertedIndex = nativeSheet.insertRule(this.text, nativeSheet.cssRules.length)
            this.native = nativeSheet.cssRules.item(insertedIndex) as CSSLayerBlockRule
        }
    }

    insert(rule: Rule | VariableRule, index = this.rules.length) {
        const insertedIndex = super.insert(rule, index)
        if (insertedIndex === undefined || !this.native) return
        const insertRuleSafely = (text: string, position: number) => {
            try {
                const insertedIndex = this.native!.insertRule(text, position)
                return this.native!.cssRules.item(insertedIndex) as CSSRule
            } catch (error) {
                console.error(error, rule)
                return
            }
        }
        if ('nodes' in rule) {
            let currentIndex = insertedIndex
            rule.nodes.forEach((node) => {
                node.native = insertRuleSafely(node.text, currentIndex)
                if (node.native) currentIndex++
            })
        } else {
            rule.native = insertRuleSafely(rule.text, index)
        }
        return insertedIndex
    }

    detach() {
        super.detach()
        const nativeSheet = this.cssRuntime.style?.sheet
        if (nativeSheet && this.native?.parentStyleSheet) {
            const foundIndex = findNativeCSSRuleIndex(nativeSheet.cssRules, this.native)
            if (foundIndex !== -1) {
                nativeSheet.deleteRule(foundIndex)
            }
        }
    }

    delete(key: string) {
        const deletedRule = super.delete(key)
        if (!deletedRule || !this.native) return
        const deleteRuleSafely = (rule?: CSSRule) => {
            if (!rule) return
            const foundIndex = findNativeCSSRuleIndex(this.native!.cssRules, rule)
            if (foundIndex !== -1) {
                try {
                    this.native!.deleteRule(foundIndex)
                } catch (error) {
                    console.error(error, rule)
                }
            }
        }
        if ('nodes' in deletedRule) {
            deletedRule.nodes.forEach((node) => deleteRuleSafely(node.native))
        } else {
            deleteRuleSafely(deletedRule.native)
        }
        return deletedRule
    }

    reset() {
        super.reset()
        const nativeSheet = this.cssRuntime.style?.sheet
        if (this.native && nativeSheet) {
            const foundIndex = findNativeCSSRuleIndex(nativeSheet.cssRules, this.native)
            if (foundIndex !== -1) {
                nativeSheet.deleteRule(foundIndex)
            }
            this.native = null
        }
    }
}