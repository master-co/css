import type { SyntaxRule } from '../syntax-rule'

export default function areRuleSelectorsEqual(aSyntaxRule: SyntaxRule, bSyntaxRule: SyntaxRule) {
    // suffix
    const aVendorSuffixSelectorKeys = aSyntaxRule.vendorSuffixSelectors ? Object.keys(aSyntaxRule.vendorSuffixSelectors) : []
    const bVendorSuffixSelectorKeys = bSyntaxRule.vendorSuffixSelectors ? Object.keys(bSyntaxRule.vendorSuffixSelectors) : []
    if (aVendorSuffixSelectorKeys.length !== bVendorSuffixSelectorKeys.length)
        return false
    const isSameVendorSuffixSelectors = aVendorSuffixSelectorKeys.every(eachAKey => {
        if (!Object.prototype.hasOwnProperty.call(bSyntaxRule.vendorSuffixSelectors, eachAKey))
            return false
        const aValues = aSyntaxRule.vendorSuffixSelectors[eachAKey]
        const bValues = bSyntaxRule.vendorSuffixSelectors[eachAKey]
        return aValues.length === bValues.length
            && aValues.every(eachAValue => bValues.includes(eachAValue))
    })
    if (!isSameVendorSuffixSelectors) return false

    // prefix
    const aVendorPrefixSelectorKeys = aSyntaxRule.vendorPrefixSelectors ? Object.keys(aSyntaxRule.vendorPrefixSelectors) : []
    const bVendorPrefixSelectorKeys = bSyntaxRule.vendorPrefixSelectors ? Object.keys(bSyntaxRule.vendorPrefixSelectors) : []
    if (aVendorPrefixSelectorKeys.length !== bVendorPrefixSelectorKeys.length)
        return false
    const isSameVendorPrefixSelectors = aVendorPrefixSelectorKeys.every(eachAKey => {
        if (!Object.prototype.hasOwnProperty.call(bSyntaxRule.vendorPrefixSelectors, eachAKey))
            return false
        const aValues = aSyntaxRule.vendorPrefixSelectors?.[eachAKey] || []
        const bValues = bSyntaxRule.vendorPrefixSelectors?.[eachAKey] || []
        return aValues.length === bValues.length
            && aValues.every(eachAValue => bValues.includes(eachAValue))
    })
    if (!isSameVendorPrefixSelectors) return false

    return true
}