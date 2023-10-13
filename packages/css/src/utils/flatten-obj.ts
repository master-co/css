export function flattenObject(obj, joiner = '.', parentKey = '') {
    return Object.keys(obj).reduce((acc, key) => {
        const newKey = parentKey ? `${parentKey}${key? joiner + key : ''}` : key
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            Object.assign(acc, flattenObject(obj[key], joiner, newKey))
        } else {
            acc[newKey] = obj[key]
        }
        return acc
    }, {})
}