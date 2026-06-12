export default function flattenObject(
    obj: Record<string, any>,
    name: string[] = [],
    result: Record<string, any> = {}
): Record<string, any> {
    for (const [key, value] of Object.entries(obj)) {
        const nextName = [...name, key].filter(Boolean)
        const flatKey = nextName.join('-')
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            flattenObject(value, nextName, result)
        } else {
            result[flatKey] = Array.isArray(value) ? value.join(',') : value
        }
    }
    return result
}
