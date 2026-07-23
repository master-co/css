import assert from 'node:assert/strict'
import test from 'node:test'
import { collectCSSVariableReferences } from './css-variable-references'

test('collects active CSS variable references including nested fallbacks', () => {
    assert.deepEqual(
        collectCSSVariableReferences([
            'var(--real)',
            '"var(--quoted)"',
            '/* var(--commented) */',
            'VAR( --brand, var(--fallback))',
            'xvar(--identifier)'
        ].join(' ')),
        ['real', 'brand', 'fallback']
    )
})

test('ignores malformed variable functions', () => {
    assert.deepEqual(
        collectCSSVariableReferences('var(color) var(--unclosed'),
        []
    )
})
