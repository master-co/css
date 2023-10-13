export function flattenObject(obj, joiner = '/', parentKey = '') {
    return Object.keys(obj).reduce((acc, key) => {
        const newKey = parentKey ? `${parentKey}${key? joiner + key : ''}` : key
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            Object.assign(acc, flattenObject(obj[key], joiner, newKey.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()))
        } else {
            acc[newKey] = obj[key]
        }
        return acc
    }, {})
}