export default function areVendorPrefixSelectorsEqual(aVendorPrefixSelectors, bVendorPrefixSelectors) {
    const aKeys = Object.keys(aVendorPrefixSelectors)
    if (aKeys.length !== Object.keys(bVendorPrefixSelectors).length)
        return false

    return aKeys.every(eachAKey => {
        if (!Object.prototype.hasOwnProperty.call(bVendorPrefixSelectors, eachAKey))
            return false

        const aValues = aVendorPrefixSelectors[eachAKey]
        const bValues = bVendorPrefixSelectors[eachAKey]
        return aValues.length === bValues.length
            && aValues.every(eachAValue => bValues.includes(eachAValue))
    })
}