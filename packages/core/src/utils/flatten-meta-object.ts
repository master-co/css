type FlatVariable = {
    name: string
    value: any
    key: string
    group?: string
    namespace?: string
}

export default function flattenMetaObject(
    obj: Record<string, any>,
    name: string[] = [],
    result: Record<string, FlatVariable> = {},
    modes: Record<string, Record<string, FlatVariable>> = {}
) {
    for (const [rawKey, rawValue] of Object.entries(obj)) {
        // Inline mode marker: keys starting with '@' (e.g. '@light', '@dark')
        // route the value into the modes accumulator under the parent path,
        // instead of producing a literal `<parent>-@<mode>` flat variable.
        if (rawKey.startsWith('@') && name.length > 0) {
            const modeName = rawKey.slice(1)
            const parentFlatKey = name.join('-')
            const parentKey = name[name.length - 1]
            const parentGroup = name.slice(0, -1).join('.')
            const parentNamespace = name[0]
            modes[modeName] ??= {}
            modes[modeName][parentFlatKey] = {
                name: parentFlatKey,
                key: parentKey,
                value: Array.isArray(rawValue) ? rawValue.join(',') : rawValue,
                group: name.length > 1 ? parentGroup : undefined,
                namespace: name.length > 1 ? parentNamespace : undefined,
            }
            continue
        }

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
            flattenMetaObject(rawValue, path, result, modes)
        }
    }

    return result
}
