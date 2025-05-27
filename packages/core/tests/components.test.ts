import { describe, expect, test } from 'vitest'
import { createCSS } from '../src'

describe('comp -> comp -> var', () => {
    const css = createCSS({
        components: {
            badge: {
                primary: 'strong-primary',
            },
            strong: {
                primary: 'bg:primary fg:primary-text outline:1|primary-active'
            },
            modeTrigger: 'class'
        },
        modes: {
            light: {
                primary: '$color-black',
                'primary-text': '$color-white',
                'primary-active': '$gray',
            },
            dark: {
                primary: '$color-white',
                'primary-text': '$color-black',
                'primary-active': '$color-white',
            }
        }
    })
    css.add('badge-primary')
    test('badge with common strong comp', () => {
        expect(css.text).toMatchSnapshot()
    })
})

describe('extends', () => {
    const css = createCSS({
        extends: [
            { components: { a: 'order:1' } },
            { components: { b: 'order:2' } },
            { components: { c: 'order:3' } },
            { components: { a: 'order:11' } },
        ],
        components: {
            b: 'order:22'
        }
    })
    test('a should be order:11', () => {
        expect(css.components.get('a')).toEqual(['order:11'])
    })
    test('b should be order:22', () => {
        expect(css.components.get('b')).toEqual(['order:22'])
    })
    test('c should be order:3', () => {
        expect(css.components.get('c')).toEqual(['order:3'])
    })
})