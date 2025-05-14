export default function nestMetaObject(
    obj: Record<
        string,
        { name: string; value: any; key: string; group?: string; namespace?: string }
    >
): Record<string, any> {
    const result: Record<string, any> = {}

    for (const { key, value, group } of Object.values(obj)) {
        const path = [...(group ? group.split('.') : []), key]
        let current = result

        for (let i = 0; i < path.length; i++) {
            const part = path[i]
            const isLast = i === path.length - 1

            if (isLast) {
                current[part] = value
            } else {
                if (!(part in current)) {
                    current[part] = {}
                }
                current = current[part]
            }
        }
    }

    return result
}
