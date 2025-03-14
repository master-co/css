import { Rule } from './rule'
import MasterCSS from './core'
import findNativeCSSRuleIndex from 'shared/utils/find-native-css-rule-index'

export default class Layer {
    readonly rules: Rule[] = []
    readonly usages: Record<string, number> = {}
    native: CSSLayerBlockRule | null = null

    constructor(
        public name: string,
        public css: MasterCSS
    ) { }

    insert(rule: Rule, index?: number) {
        if (this.rules.find((({ key }) => key === rule.key))) return

        if (!this.css.rules.includes(this)) {
            this.css.rules.push(this)
            const nativeSheet = this.css.style?.sheet
            if (nativeSheet && !this.native?.parentStyleSheet) {
                const insertedIndex = nativeSheet.insertRule(this.text, nativeSheet.cssRules.length)
                this.native = nativeSheet.cssRules.item(insertedIndex) as CSSLayerBlockRule
            }
        }

        if (index === undefined) {
            index = this.rules.length
        }

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
            })(this, index as number - 1)
            if (lastCssRule) {
                for (let i = 0; i < this.native.cssRules.length; i++) {
                    if (this.native.cssRules[i] === lastCssRule) {
                        cssRuleIndex = i + 1
                        break
                    }
                }
            }

            for (let i = 0; i < rule.nodes.length;) {
                try {
                    const node = rule.nodes[i]
                    const insertedIndex = this.native.insertRule(node.text, cssRuleIndex)
                    node.native = this.native.cssRules.item(insertedIndex) as CSSRule
                    cssRuleIndex++
                    i++
                } catch (error) {
                    console.error(error, rule.nodes[i])
                    rule.nodes.splice(i, 1)
                }
            }
        }

        this.rules.splice(index as number, 0, rule)
        return index
    }

    delete(key: string) {
        const rule = this.rules.find((rule) => (rule as Rule).key === key)
        if (!rule) return
        if (this.rules.length === 1) {
            const indexOfLayer = this.css.rules.indexOf(this)
            this.css.rules.splice(indexOfLayer, 1)
            const nativeSheet = this.css.style?.sheet
            if (nativeSheet && this.native?.parentStyleSheet) {
                const foundIndex = findNativeCSSRuleIndex(nativeSheet.cssRules, this.native)
                if (foundIndex !== -1) {
                    nativeSheet.deleteRule(foundIndex)
                }
            }
        }
        if (this.native?.cssRules && 'nodes' in rule) {
            for (const node of rule.nodes) {
                if (node.native) {
                    const foundIndex = findNativeCSSRuleIndex(this.native.cssRules, node.native)
                    if (foundIndex !== -1) {
                        // todo: Firefox throw "Uncaught NS_ERROR_FAILURE". Reproduce: Add '@fade|1s @fade|2s' and remove '@fade|1s @fade|2s'
                        this.native.deleteRule(foundIndex)
                    }
                }
            }
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
        const nativeSheet = this.css.style?.sheet
        if (this.native && nativeSheet) {
            const foundIndex = findNativeCSSRuleIndex(nativeSheet.cssRules, this.native)
            if (foundIndex !== -1) {
                nativeSheet.deleteRule(foundIndex)
            }
            this.native = null
        }
    }

    get text(): string {
        return '@layer ' + this.name + '{' + this.rules.map(({ text }) => text).join('') + '}'
    }
}