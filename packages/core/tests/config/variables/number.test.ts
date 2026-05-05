import { it, test, expect } from 'vitest'
import { createCSS } from '../../../src'
import { expectLayers } from '../../test'

test.concurrent('number', () => {
    expectLayers(
        {
            general: '.m\\:x1{margin:1rem}'
        },
        'm:x1',
        { variables: [{ namespace: 'spacing', key: 'x1', value: 16 }] }
    )
})

test.concurrent('number with themes', () => {
    expectLayers(
        {
            general: '.m\\:x1{margin:calc(var(--spacing-x1) / 16 * 1rem)}',
            theme: ':root{--spacing-x1:16}.light{--spacing-x1:48}.dark{--spacing-x1:32}'
        },
        'm:x1',
        { variables: [{ namespace: 'spacing', key: 'x1', value: 16 }, { namespace: 'spacing', key: 'x1', value: 48, mode: 'light' }, { namespace: 'spacing', key: 'x1', value: 32, mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )

    // 無單位屬性不需要 calc
    expectLayers(
        {
            general: '.line-height\\:x1{line-height:var(--line-height-x1)}',
            theme: ':root{--line-height-x1:16}.light{--line-height-x1:48}.dark{--line-height-x1:32}'
        },
        'line-height:x1',
        { variables: [{ namespace: 'line-height', key: 'x1', value: 16 }, { namespace: 'line-height', key: 'x1', value: 48, mode: 'light' }, { namespace: 'line-height', key: 'x1', value: 32, mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )
})

test.concurrent('number using variable function', () => {
    expectLayers(
        {
            general: '.m\\:\\$\\(spacing-x1\\){margin:1rem}'
        },
        'm:$(spacing-x1)',
        { variables: [{ namespace: 'spacing', key: 'x1', value: 16 }] }
    )
})

test.concurrent('number with themes using variable function', () => {
    expectLayers(
        {
            general: '.m\\:\\$\\(spacing-x1\\){margin:calc(var(--spacing-x1) / 16 * 1rem)}',
            theme: ':root{--spacing-x1:16}.light{--spacing-x1:48}.dark{--spacing-x1:32}'
        },
        'm:$(spacing-x1)',
        { variables: [{ namespace: 'spacing', key: 'x1', value: 16 }, { namespace: 'spacing', key: 'x1', value: 48, mode: 'light' }, { namespace: 'spacing', key: 'x1', value: 32, mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )

    // 無單位屬性不需要 calc
    expectLayers(
        {
            general: '.line-height\\:\\$\\(spacing-x1\\){line-height:var(--spacing-x1)}',
            theme: ':root{--spacing-x1:16}.light{--spacing-x1:48}.dark{--spacing-x1:32}'
        },
        'line-height:$(spacing-x1)',
        { variables: [{ namespace: 'spacing', key: 'x1', value: 16 }, { namespace: 'spacing', key: 'x1', value: 48, mode: 'light' }, { namespace: 'spacing', key: 'x1', value: 32, mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )
})

test.concurrent('variables', () => {
    expect(createCSS({ variables: [{ namespace: 'spacing', key: 'x1', value: 16 }, { namespace: 'spacing', key: 'x2', value: 32 }] }).create('m:$(spacing-x1)')?.text).toBe('.m\\:\\$\\(spacing-x1\\){margin:1rem}')
})

test.concurrent('negative variables', () => {
    expect(createCSS({ variables: [{ namespace: 'spacing', key: 'x1', value: 16 }, { namespace: 'spacing', key: 'x2', value: 32 }] }).create('m:$(-spacing-x1)')?.text).toBe('.m\\:\\$\\(-spacing-x1\\){margin:-1rem}')

    expectLayers(
        {
            general: '.w\\:-11x{width:-3.75rem}'
        },
        'w:-11x',
        { variables: [{ namespace: 'width', key: '11x', value: 60 }] }
    )
})

test.concurrent('negative screens', () => {
    expectLayers(
        {
            general: '.mb\\:-screen-md{margin-bottom:-64rem}'
        },
        'mb:-screen-md'
    )
})
