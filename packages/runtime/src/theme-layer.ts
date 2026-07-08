import { ThemeLayer, VariableRule } from '@master/css-engine'
import findNativeCSSRuleIndex from './utils/find-native-css-rule-index'
import CSSRuntime from './core'

interface NativeBucket {
  key: string
  mediaText: string
  mode?: string
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

  private setBucketSyntheticDeclarations(bucket: NativeBucket, mode?: string) {
    for (const { name, value } of this.getBucketSyntheticDeclarations({
      mediaText: bucket.mediaText,
      mode,
      selectorText: bucket.selectorText
    })) {
      bucket.styleRule.style.setProperty(name, value)
    }
  }

  private hasVariableDeclarations(styleRule: CSSStyleRule) {
    for (let index = 0; index < styleRule.style.length; index++) {
      if (styleRule.style.item(index).startsWith('--')) return true
    }
    return false
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

  ensureNativeBucket(mediaText: string, selectorText: string, mode?: string) {
    if (!this.native) return
    const key = this.getBucketKey(mediaText, selectorText)
    let bucket = this.nativeBuckets.get(key)
    if (bucket) {
      this.setBucketSyntheticDeclarations(bucket, mode)
      return bucket
    }
    const declarationText = this.getBucketSyntheticDeclarations({
      mediaText,
      mode,
      selectorText
    }).map(({ name, value }) => `${name}:${value}`).join(';')
    const text = mediaText
      ? `${mediaText}{${selectorText}{${declarationText}}}`
      : `${selectorText}{${declarationText}}`
    const insertedIndex = this.native.insertRule(text, this.getNativeBucketInsertIndex(mediaText, selectorText))
    const nativeRule = this.native.cssRules.item(insertedIndex)
    if (!nativeRule) return
    const styleRule = this.getStyleRule(nativeRule)
    if (!styleRule) return
    const newBucket = {
      key,
      mediaText,
      mode,
      selectorText,
      nativeRule,
      styleRule
    }
    this.nativeBuckets.set(key, newBucket)
    return newBucket
  }

  getNativeBucketInsertIndex(mediaText: string, selectorText: string) {
    if (!this.native) return 0
    const bucket = { mediaText, selectorText }
    for (let index = 0; index < this.native.cssRules.length; index++) {
      const nativeRule = this.native.cssRules.item(index)
      if (!nativeRule) continue
      const styleRule = this.getStyleRule(nativeRule)
      if (!styleRule) continue
      const nativeMediaText = nativeRule instanceof CSSMediaRule ? `@media ${nativeRule.conditionText}` : ''
      if (this.shouldInsertBucketBefore(bucket, {
        mediaText: nativeMediaText,
        selectorText: styleRule.selectorText
      })) {
        return index
      }
    }
    return this.native.cssRules.length
  }

  insert(rule: VariableRule, index = this.rules.length) {
    const wasEmpty = this.rules.length === 0
    const insertedIndex = super.insert(rule, index)
    if (insertedIndex === undefined || !this.native || wasEmpty) return insertedIndex
    for (const node of rule.nodes) {
      const bucket = this.ensureNativeBucket(node.mediaText, node.selectorText, node.mode)
      if (bucket) {
        this.setBucketSyntheticDeclarations(bucket, node.mode)
        bucket.styleRule.style.setProperty(node.declarationName, node.declarationValue)
        node.native = bucket.styleRule
      }
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
      if (!this.hasVariableDeclarations(bucket.styleRule)) {
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
