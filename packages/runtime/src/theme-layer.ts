import { ThemeLayer, VariableRule } from '@master/css'
import findNativeCSSRuleIndex from 'shared/utils/find-native-css-rule-index'
import CSSRuntime from './core'

interface NativeBucket {
    key: string
    mediaText: string
    selectorText: string
    nativeRule: CSSRule
    styleRule: CSSStyleRule
}

export default class RuntimeThemeLayer extends ThemeLayer {
    native: CSSLayerBlockRule | null = null
    private nativeBuckets = new Map<string, NativeBucket>()

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
            this.syncNativeBuckets()
        }
    }

    getBucketKey(mediaText: string, selectorText: string) {
        const normalizedMediaText = mediaText.replace(/\s*:\s*/g, ':').replace(/\s+/g, ' ').trim()
        const normalizedSelectorText = selectorText.replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim()
        return normalizedMediaText + '\n' + normalizedSelectorText
    }

    getStyleRule(nativeRule: CSSRule): CSSStyleRule | undefined {
        if (nativeRule instanceof CSSStyleRule) return nativeRule
        if (nativeRule instanceof CSSGroupingRule) {
            return nativeRule.cssRules.item(0) as CSSStyleRule | undefined
        }
    }

    syncNativeBuckets() {
        this.nativeBuckets.clear()
        if (!this.native) return
        for (const nativeRule of this.native.cssRules) {
            const styleRule = this.getStyleRule(nativeRule)
            if (!styleRule) continue
            const mediaText = nativeRule instanceof CSSMediaRule ? nativeRule.conditionText : ''
            const normalizedMediaText = mediaText ? `@media ${mediaText}` : ''
            const key = this.getBucketKey(normalizedMediaText, styleRule.selectorText)
            this.nativeBuckets.set(key, {
                key,
                mediaText: normalizedMediaText,
                selectorText: styleRule.selectorText,
                nativeRule,
                styleRule
            })
        }
    }

    ensureNativeBucket(mediaText: string, selectorText: string) {
        if (!this.native) return
        const key = this.getBucketKey(mediaText, selectorText)
        let bucket = this.nativeBuckets.get(key)
        if (bucket) return bucket
        const text = mediaText
            ? `${mediaText}{${selectorText}{}}`
            : `${selectorText}{}`
        const insertedIndex = this.native.insertRule(text, this.native.cssRules.length)
        const nativeRule = this.native.cssRules.item(insertedIndex)
        if (!nativeRule) return
        const styleRule = this.getStyleRule(nativeRule)
        if (!styleRule) return
        const newBucket = {
            key,
            mediaText,
            selectorText,
            nativeRule,
            styleRule
        }
        this.nativeBuckets.set(key, newBucket)
        return newBucket
    }

    insert(rule: VariableRule, index = this.rules.length) {
        const wasEmpty = this.rules.length === 0
        const insertedIndex = super.insert(rule, index)
        if (insertedIndex === undefined || !this.native || wasEmpty) return insertedIndex
        for (const node of rule.nodes) {
            const bucket = this.ensureNativeBucket(node.mediaText, node.selectorText)
            bucket?.styleRule.style.setProperty(node.declarationName, node.declarationValue)
            node.native = bucket?.styleRule
        }
        return insertedIndex
    }

    delete(key: string) {
        const rule = this.rules.find((rule) => rule.key === key)
        const deletedRule = super.delete(key) as VariableRule | undefined
        if (!rule || !deletedRule || !this.native) return deletedRule
        for (const node of rule.nodes) {
            const bucketKey = this.getBucketKey(node.mediaText, node.selectorText)
            const bucket = this.nativeBuckets.get(bucketKey)
            if (!bucket) continue
            bucket.styleRule.style.removeProperty(node.declarationName)
            if (bucket.styleRule.style.length === 0) {
                const foundIndex = findNativeCSSRuleIndex(this.native.cssRules, bucket.nativeRule)
                if (foundIndex !== -1) {
                    this.native.deleteRule(foundIndex)
                }
                this.nativeBuckets.delete(bucketKey)
            }
        }
        return deletedRule
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
        this.native = null
        this.nativeBuckets.clear()
    }

    reset() {
        super.reset()
        const nativeSheet = this.cssRuntime.style?.sheet
        if (this.native && nativeSheet) {
            const foundIndex = findNativeCSSRuleIndex(nativeSheet.cssRules, this.native)
            if (foundIndex !== -1) {
                nativeSheet.deleteRule(foundIndex)
            }
        }
        this.native = null
        this.nativeBuckets.clear()
    }
}
