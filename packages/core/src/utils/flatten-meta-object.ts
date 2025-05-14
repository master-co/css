export default function flattenMetaObject(
    obj: Record<string, any>,
    name: string[] = [],
    result: Record<
        string,
        { name: string; value: any; key: string; group?: string; namespace?: string }
    > = {}
) {
    for (const [key, value] of Object.entries(obj)) {
        const nextName = [...name, key].filter(Boolean)
        const flatKey = nextName.join('-')
        const pathLength = nextName.length
        const isObject = value && typeof value === 'object' && !Array.isArray(value)

        let finalValue: any
        let shouldEmit = false

        if (isObject && Object.keys(value).length === 1 && '' in value) {
            finalValue = value['']
            shouldEmit = true
        } else if (!isObject) {
            finalValue = Array.isArray(value) ? value.join(',') : value
            shouldEmit = true
        }

        if (shouldEmit) {
            const entry: {
                name: string
                key: string
                value: any
                group?: string
                namespace?: string
            } = {
                name: flatKey,
                key,
                value: finalValue
            }

            if (pathLength > 1) {
                entry.group = nextName.slice(0, -1).join('.')
                entry.namespace = nextName[0]
            }

            result[flatKey] = entry
        } else {
            flattenMetaObject(value, nextName, result)
        }
    }

    return result
}
