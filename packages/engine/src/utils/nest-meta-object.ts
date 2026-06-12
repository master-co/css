export default function nestMetaObject(
    flat: Record<
        string,
        { name: string; value: any; key: string; group?: string; namespace?: string }
    >
): Record<string, any> {
    const nested: Record<string, any> = {}

    for (const entry of Object.values(flat)) {
        const { group, key, value } = entry
        const path = group ? group.split('.') : []
        let current = nested as any

        for (const segment of path) {
            if (!(segment in current)) {
                current[segment] = {}
            } else if (typeof current[segment] !== 'object' || current[segment] === null) {
                // Wrap primitive into object: { '': value }
                current[segment] = { '': current[segment] }
            }
            current = current[segment]
        }

        current[key] = value
    }

    return nested
}
