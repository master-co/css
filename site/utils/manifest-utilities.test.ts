import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getTokenNamespacePublicKeys, getVariableNamespacePublicKeys, tokenFamilies } from './manifest-utilities'

test('spacing token namespace public keys contain only loaded family prefixes', () => {
  const keys = getTokenNamespacePublicKeys('spacing')

  for (const expected of ['m', 'mt', 'p', 'px', 'gap', 'gap-x', 'inset', 'scroll-mt', 'text-indent']) {
    assert.ok(keys.includes(expected), expected)
  }
  assert.equal(keys.some((key) => !key), false)
  assert.equal(keys.some((key) => key.includes('<~')), false)
  assert.equal(new Set(keys).size, keys.length)
})

test('variable namespace public keys follow the active manifest family catalog', () => {
  assertIncludes(getVariableNamespacePublicKeys('spacing'), ['p', 'px', 'gap', 'scroll-mt', 'text-indent'])
  assertIncludes(getVariableNamespacePublicKeys('container'), ['w', 'h', 'size-x', 'size-y', 'min-w', 'max-w', 'flex-basis'])
  assertIncludes(getVariableNamespacePublicKeys('radius'), ['r', 'rtl', 'rbr', 'border-start-start-radius'])
  assertIncludes(getVariableNamespacePublicKeys('color'), ['bg', 'fg', 'caret-color', 'b', 'bt', 'outline', 'stroke'])
  assert.deepEqual(getVariableNamespacePublicKeys('text'), ['text'])
  assert.deepEqual(getTokenNamespacePublicKeys('text'), [])
  assert.deepEqual(getVariableNamespacePublicKeys('font-size'), ['font'])
  assert.deepEqual(getVariableNamespacePublicKeys('font-family'), ['font'])
  assert.deepEqual(getVariableNamespacePublicKeys('font-weight'), ['font'])
  assert.deepEqual(getVariableNamespacePublicKeys('leading'), ['leading'])
  assert.deepEqual(getVariableNamespacePublicKeys('tracking'), ['tracking'])
  assert.deepEqual(getVariableNamespacePublicKeys('shadow'), ['shadow'])
  assert.deepEqual(getVariableNamespacePublicKeys('duration'), ['animation', 'animation-delay', 'transition', 'transition-delay'])
  assert.deepEqual(getVariableNamespacePublicKeys('easing'), ['animation', 'transition'])
  assertIncludes(getVariableNamespacePublicKeys('animate'), ['animate'])

  for (const namespace of ['color-surface', 'color-text', 'color-line', 'content', 'font-feature']) {
    assert.deepEqual(getVariableNamespacePublicKeys(namespace), [], namespace)
  }
  for (const namespace of ['spacing', 'container', 'radius', 'color', 'text', 'font-size', 'font-family', 'font-weight', 'leading', 'tracking', 'shadow', 'duration', 'easing', 'animate']) {
    const keys = getVariableNamespacePublicKeys(namespace)
    assert.equal(keys.some((key) => !key), false, namespace)
    assert.equal(keys.some((key) => key.includes('<~')), false, namespace)
    assert.equal(new Set(keys).size, keys.length, namespace)
  }
})

test('family tables omit removed preset definitions and native property aliases', () => {
  assert.equal(tokenFamilies.filter(family => family.argument === 'value').length, 119)
  assert.equal(tokenFamilies.filter(family => family.argument === 'key').length, 1)
  assert.equal(new Set(tokenFamilies.map(family => `${family.prefix}:${family.namespace}`)).size, tokenFamilies.length)
  assert.equal(tokenFamilies.filter(family => family.prefix === 'font').length, 3)
  const prefixes = tokenFamilies.map(family => family.prefix)
  for (const name of ['text-gradient', 'text-underline', 'text-decoration', 'text-stroke', 'contain-intrinsic-block-size', 'contain-intrinsic-inline-size', 'content', 'font-feature-settings', 'font-antialiased', 'font-smoothing-auto', 'padding', 'color', 'width']) {
    assert.ok(!prefixes.includes(name), name)
  }
})

function assertIncludes(keys: string[], expectedKeys: string[]) {
  for (const expected of expectedKeys) {
    assert.ok(keys.includes(expected), expected)
  }
}
