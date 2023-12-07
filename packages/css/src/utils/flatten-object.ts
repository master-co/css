export function flattenObject(obj: Record<string, any>, parentKey = ''): Record<string, any> {
    return Object.entries(obj).reduce((acc: Record<string, any>, [key, value]) => {
        const currentKey = parentKey
            ? `${parentKey}${key ? '-' + key : ''}`
            : key

        if (typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(acc, flattenObject(value, currentKey))
        } else {
            acc[currentKey] = value
        }

        return acc
    }, {})
}