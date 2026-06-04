import { expect, test } from 'vitest'
import utilities from '../../src/utilities'

test.concurrent('default utilities do not reuse key or subkey tokens', () => {
    const seen = new Map<string, string>()
    const duplicates: string[] = []

    for (const utility of utilities) {
        for (const field of ['key', 'subkey'] as const) {
            const token = utility[field]
            if (!token) continue

            const owner = `${utility.name}.${field}`
            const previousOwner = seen.get(token)
            if (previousOwner) {
                duplicates.push(`${token}: ${previousOwner}, ${owner}`)
            } else {
                seen.set(token, owner)
            }
        }
    }

    expect(duplicates).toEqual([])
})
