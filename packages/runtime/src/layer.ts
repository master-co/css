import { Layer, Rule } from '@master/css'
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

    override attach() {
        super.attach()
        const nativeSheet = this.cssRuntime.style?.sheet
        if (nativeSheet && !this.native?.parentStyleSheet) {
            const insertedIndex = nativeSheet.insertRule(this.text, nativeSheet.cssRules.length)
            this.native = nativeSheet.cssRules.item(insertedIndex) as CSSLayerBlockRule
        }
    }

    insert(rule: Rule, index = this.rules.length) {
        const insertedIndex = super.insert(rule, index)
        if (insertedIndex === undefined) return
        if (this.native) {
            let cssRuleIndex = 0
            const lastCssRule = (function getLastCssRule(layer: Layer, index: number) {
                let lastCssRule: any
                const previouRule = layer.rules[index]
                if (previouRule && 'nodes' in previouRule) {
                    if (!previouRule.nodes.length)
                        return getLastCssRule(layer, index - 1)
                    const lastNativeRule = previouRule.nodes[previouRule.nodes.length - 1]
                    lastCssRule = lastNativeRule.native
                }
                return lastCssRule
            })(this, insertedIndex as number - 1)
            if (lastCssRule) {
                for (let i = 0; i < this.native.cssRules.length; i++) {
                    if (this.native.cssRules[i] === lastCssRule) {
                        cssRuleIndex = i + 1
                        break
                    }
                }
            }

            for (let i = 0; i < rule.nodes.length;) {
                const node = rule.nodes[i]
                if (node.unsupported) {
                    i++
                } else {
                    try {
                        const insertedIndex = this.native.insertRule(node.text, cssRuleIndex)
                        node.native = this.native.cssRules.item(insertedIndex) as CSSRule
                        cssRuleIndex++
                        i++
                    } catch (error) {
                        console.error(error, node)
                        rule.nodes.splice(i, 1)
                    }
                }
            }
        }
        return insertedIndex
    }

    override detach() {
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
        if (!deletedRule) return
        if (this.native?.cssRules && 'nodes' in deletedRule) {
            for (const node of deletedRule.nodes) {
                if (node.native) {
                    const foundIndex = findNativeCSSRuleIndex(this.native.cssRules, node.native)
                    if (foundIndex !== -1) {
                        // todo: Firefox throw "Uncaught NS_ERROR_FAILURE". Reproduce: Add '@fade|1s @fade|2s' and remove '@fade|1s @fade|2s'
                        this.native.deleteRule(foundIndex)
                    }
                }
            }
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