import { expect, test } from 'vitest'
import rules from '../../src/config/rules'

test.concurrent('default rules do not reuse key, subkey, or sign tokens', () => {
    const seen = new Map<string, string>()
    const duplicates: string[] = []

    for (const rule of rules) {
        for (const field of ['key', 'subkey', 'sign'] as const) {
            const token = rule[field]
            if (!token) continue

            const owner = `${rule.name}.${field}`
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
