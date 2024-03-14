import type { Rule } from '../rule'

export default function areRuleSelectorsEqual(aRule: Rule, bRule: Rule) {
    // suffix
    const aVendorSuffixSelectorKeys = Object.keys(aRule.vendorSuffixSelectors)
    const bVendorSuffixSelectorKeys = Object.keys(bRule.vendorSuffixSelectors)
    if (aVendorSuffixSelectorKeys.length !== bVendorSuffixSelectorKeys.length)
        return false
    const isSameVendorSuffixSelectors = aVendorSuffixSelectorKeys.every(eachAKey => {
        if (!Object.prototype.hasOwnProperty.call(bRule.vendorSuffixSelectors, eachAKey))
            return false
        const aValues = aRule.vendorSuffixSelectors[eachAKey]
        const bValues = bRule.vendorSuffixSelectors[eachAKey]
        return aValues.length === bValues.length
            && aValues.every(eachAValue => bValues.includes(eachAValue))
    })
    if (!isSameVendorSuffixSelectors) return false

    // prefix
    const aVendorPrefixSelectorKeys = Object.keys(aRule.vendorPrefixSelectors)
    const bVendorPrefixSelectorKeys = Object.keys(bRule.vendorPrefixSelectors)
    if (aVendorPrefixSelectorKeys.length !== bVendorPrefixSelectorKeys.length)
        return false
    const isSameVendorPrefixSelectors = aVendorPrefixSelectorKeys.every(eachAKey => {
        if (!Object.prototype.hasOwnProperty.call(bRule.vendorPrefixSelectors, eachAKey))
            return false
        const aValues = aRule.vendorPrefixSelectors[eachAKey]
        const bValues = bRule.vendorPrefixSelectors[eachAKey]
        return aValues.length === bValues.length
            && aValues.every(eachAValue => bValues.includes(eachAValue))
    })
    if (!isSameVendorPrefixSelectors) return false

    return true
}