import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getNativeValueNamespacePublicKeys } from './manifest-utilities'

test('spacing native namespace public keys include aliases and native properties', () => {
    const keys = getNativeValueNamespacePublicKeys('spacing')

    for (const expected of ['m', 'mt', 'p', 'px', 'gap', 'gap-x', 'inset', 'scroll-mt', 'text-underline-offset']) {
        assert.ok(keys.includes(expected), expected)
    }
    assert.equal(keys.some((key) => !key), false)
    assert.equal(keys.some((key) => key.includes('<~')), false)
    assert.equal(new Set(keys).size, keys.length)
})
