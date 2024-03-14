export default function areDeclarationsEqual(aDeclarations, bDeclarations) {
    const aKeys = Object.keys(aDeclarations)
    const bKeys = Object.keys(bDeclarations)

    if (aKeys.length !== bKeys.length) {
        return false
    }

    for (const key of aKeys) {
        if (!Object.prototype.hasOwnProperty.call(bDeclarations, key)) {
            return false
        }
    }

    return true
}