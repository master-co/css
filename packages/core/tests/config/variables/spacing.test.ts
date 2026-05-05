import { it, test, expect } from 'vitest'
import { createCSS } from '../../../src'

it.concurrent('should be able to access custom spacing variables using inherited rules', () => {
    const css = createCSS({ variables: [{ namespace: 'spacing', key: 'md', value: 20 }] })
    expect(css.create('mt:md')?.declarations).toStrictEqual({ 'margin-top': '1.25rem' })
    expect(css.create('p:md')?.declarations).toStrictEqual({ 'padding': '1.25rem' })
    expect(css.create('p:-md')?.declarations).toStrictEqual({ 'padding': '-1.25rem' })
    expect(Object.fromEntries(css.definedUtilities.find(({ id }) => id === 'padding')?.variables || [])).toMatchObject({
        'md': {
            'key': 'md',
            'type': 'number',
            'value': 20,
        },
        '-md': {
            'key': '-md',
            'type': 'number',
            'value': -20,
        }
    })
})
