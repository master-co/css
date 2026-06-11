import { it, test, expect } from 'vitest'
import { expectLayers } from '../../test'
import createCSSWithTheme from '../../helpers/create-css-with-theme'

test.concurrent('number', () => {
    expectLayers(
        {
            utilities: '.m\\:x1{margin:calc(var(--spacing-x1) / 16 * 1rem)}'
        },
        'm:x1',
        { variables: [{ namespace: 'spacing', key: 'x1', value: 16 }] }
    )
})

test.concurrent('number with themes', () => {
    expectLayers(
        {
            utilities: '.m\\:x1{margin:calc(var(--spacing-x1) / 16 * 1rem)}',
            theme: ':root{--spacing-x1:16}.light{--spacing-x1:48}.dark{--spacing-x1:32}'
        },
        'm:x1',
        { variables: [{ namespace: 'spacing', key: 'x1', value: 16 }, { namespace: 'spacing', key: 'x1', value: 48, mode: 'light' }, { namespace: 'spacing', key: 'x1', value: 32, mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )

    // 無單位屬性不需要 calc
    expectLayers(
        {
            utilities: '.line-height\\:x1{line-height:var(--leading-x1)}',
            theme: ':root{--leading-x1:16}.light{--leading-x1:48}.dark{--leading-x1:32}'
        },
        'line-height:x1',
        { variables: [{ namespace: 'leading', key: 'x1', value: 16 }, { namespace: 'leading', key: 'x1', value: 48, mode: 'light' }, { namespace: 'leading', key: 'x1', value: 32, mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )
})

test.concurrent('number using variable function', () => {
    expectLayers(
        {
            utilities: '.m\\:\\$\\(spacing-x1\\){margin:calc(var(--spacing-x1) / 16 * 1rem)}'
        },
        'm:$(spacing-x1)',
        { variables: [{ namespace: 'spacing', key: 'x1', value: 16 }] }
    )
})

test.concurrent('number with themes using variable function', () => {
    expectLayers(
        {
            utilities: '.m\\:\\$\\(spacing-x1\\){margin:calc(var(--spacing-x1) / 16 * 1rem)}',
            theme: ':root{--spacing-x1:16}.light{--spacing-x1:48}.dark{--spacing-x1:32}'
        },
        'm:$(spacing-x1)',
        { variables: [{ namespace: 'spacing', key: 'x1', value: 16 }, { namespace: 'spacing', key: 'x1', value: 48, mode: 'light' }, { namespace: 'spacing', key: 'x1', value: 32, mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )

    // 無單位屬性不需要 calc
    expectLayers(
        {
            utilities: '.line-height\\:\\$\\(spacing-x1\\){line-height:var(--spacing-x1)}',
            theme: ':root{--spacing-x1:16}.light{--spacing-x1:48}.dark{--spacing-x1:32}'
        },
        'line-height:$(spacing-x1)',
        { variables: [{ namespace: 'spacing', key: 'x1', value: 16 }, { namespace: 'spacing', key: 'x1', value: 48, mode: 'light' }, { namespace: 'spacing', key: 'x1', value: 32, mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )
})

test.concurrent('variables', () => {
    expect(createCSSWithTheme({ variables: [{ namespace: 'spacing', key: 'x1', value: 16 }, { namespace: 'spacing', key: 'x2', value: 32 }] }).create('m:$(spacing-x1)')?.text).toBe('.m\\:\\$\\(spacing-x1\\){margin:calc(var(--spacing-x1) / 16 * 1rem)}')
})

test.concurrent('negative variables', () => {
    expect(createCSSWithTheme({ variables: [{ namespace: 'spacing', key: 'x1', value: 16 }, { namespace: 'spacing', key: 'x2', value: 32 }] }).create('m:$(-spacing-x1)')?.text).toBe('.m\\:\\$\\(-spacing-x1\\){margin:calc(var(---spacing-x1) / 16 * 1rem)}')

    expectLayers(
        {
            utilities: '.w\\:-11x{width:calc(var(---width-11x) / 16 * 1rem)}'
        },
        'w:-11x',
        { variables: [{ namespace: 'width', key: '11x', value: 60 }] }
    )
})

test.concurrent('negative container variables', () => {
    expectLayers(
        {
            utilities: '.w\\:-md{width:calc(var(---container-md) / 16 * 1rem)}'
        },
        'w:-md'
    )
})
