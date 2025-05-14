export default function flattenMetaObject(
    obj: Record<string, any>,
    name: string[] = [],
    result: Record<
        string,
        { name: string; value: any; key: string; group?: string; namespace?: string }
    > = {}
) {
    for (const [rawKey, rawValue] of Object.entries(obj)) {
        const key = rawKey || name[0] || ''
        const path = [...name, rawKey].filter(Boolean)
        const flatKey = path.join('-')
        const groupPath = path.slice(0, -1).join('.')
        const namespace = path[0]

        const isObject = rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)
        const isSelfObject = isObject && Object.keys(rawValue).length === 1 && '' in rawValue

        if (isSelfObject) {
            result[flatKey] = {
                name: flatKey,
                key,
                value: rawValue[''],
                group: path.length > 1 ? groupPath : undefined,
                namespace: path.length > 1 ? namespace : undefined,
            }
        } else if (!isObject) {
            result[flatKey] = {
                name: flatKey,
                key,
                value: Array.isArray(rawValue) ? rawValue.join(',') : rawValue,
                group: path.length > 1 ? groupPath : undefined,
                namespace: path.length > 1 ? namespace : undefined,
            }
        } else {
            flattenMetaObject(rawValue, path, result)
        }
    }

    return result
}
