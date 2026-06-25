import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getNativeValueNamespacePublicKeys, getVariableNamespacePublicKeys } from './manifest-utilities'

test('spacing native namespace public keys include aliases and native properties', () => {
    const keys = getNativeValueNamespacePublicKeys('spacing')

    for (const expected of ['m', 'mt', 'p', 'px', 'gap', 'gap-x', 'inset', 'scroll-mt', 'text-underline-offset']) {
        assert.ok(keys.includes(expected), expected)
    }
    assert.equal(keys.some((key) => !key), false)
    assert.equal(keys.some((key) => key.includes('<~')), false)
    assert.equal(new Set(keys).size, keys.length)
})

test('variable namespace public keys combine native properties, manifest utilities, and aliases', () => {
    assertIncludes(getVariableNamespacePublicKeys('spacing'), ['p', 'px', 'gap', 'scroll-mt', 'text-underline', 'text-underline-offset'])
    assertIncludes(getVariableNamespacePublicKeys('container'), ['w', 'width', 'size', 'min-size', 'min', 'max-size', 'max', 'flex-basis', 'background-size'])
    assertIncludes(getVariableNamespacePublicKeys('radius'), ['r', 'rtl', 'rbr', 'border-radius', 'border-start-start-radius'])
    assertIncludes(getVariableNamespacePublicKeys('color-surface'), ['surface'])
    assertIncludes(getVariableNamespacePublicKeys('color-text'), ['text', 'fg', 'color', 'caret-color', 'text-decoration'])
    assertIncludes(getVariableNamespacePublicKeys('color-line'), ['b', 'bt', 'border-color', 'outline', 'stroke'])
    assertIncludes(getVariableNamespacePublicKeys('font-size'), ['font', 'text', 'font-size'])
    assertIncludes(getVariableNamespacePublicKeys('font-family'), ['font', 'font-family'])
    assertIncludes(getVariableNamespacePublicKeys('font-weight'), ['font', 'font-weight'])
    assertIncludes(getVariableNamespacePublicKeys('leading'), ['leading', 'line-height'])
    assertIncludes(getVariableNamespacePublicKeys('tracking'), ['tracking', 'letter-spacing'])
    assertIncludes(getVariableNamespacePublicKeys('shadow'), ['shadow', 'box-shadow'])
    assertIncludes(getVariableNamespacePublicKeys('duration'), ['animation', 'animation-duration', 'animation-delay', 'transition', 'transition-duration', 'transition-delay'])
    assertIncludes(getVariableNamespacePublicKeys('easing'), ['animation', 'animation-timing-function', 'transition', 'transition-timing-function'])
    assertIncludes(getVariableNamespacePublicKeys('animate'), ['animate'])

    for (const namespace of ['spacing', 'container', 'radius', 'color-surface', 'color-text', 'color-line', 'font-size', 'font-family', 'font-weight', 'leading', 'tracking', 'shadow', 'duration', 'easing', 'animate']) {
        const keys = getVariableNamespacePublicKeys(namespace)
        assert.equal(keys.some((key) => !key), false, namespace)
        assert.equal(keys.some((key) => key.includes('<~')), false, namespace)
        assert.equal(new Set(keys).size, keys.length, namespace)
    }
})

function assertIncludes(keys: string[], expectedKeys: string[]) {
    for (const expected of expectedKeys) {
        assert.ok(keys.includes(expected), expected)
    }
}
