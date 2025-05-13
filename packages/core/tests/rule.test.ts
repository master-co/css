import { it, test, expect, describe } from 'vitest'
import { createCSS } from '../src'
import { variables } from '../src'

test.concurrent('uncomplete', () => {
    expect(createCSS().generate('b:')[0]).toBeUndefined()
})

test.concurrent('declarations', () => {
    const css = createCSS({
        modes: {
            light: {
                primary: '#fff'
            },
            dark: {
                primary: '#000'
            }
        }
    })
    expect(css.generate('fg:primary')[0].declarations).toEqual({ color: 'var(--primary)' })
})

test.concurrent('registered Rule', () => {
    expect(createCSS().definedRules.find(({ id }) => id === 'content')).toMatchObject({
        definition: {
            key: 'content',
            type: -1
        },
        id: 'content',
        keys: ['content'],
        matchers: {
            key: /^content:/
        }
    })
})

describe.concurrent('token', () => {
    test.concurrent('value', () => {
        expect(createCSS().generate('b:1|solid|blue-60:hover[disabled]@sm')[0].valueToken).toBe('1|solid|blue-60')
    })
    test.concurrent('state', () => {
        expect(createCSS().generate('b:1|solid|blue-60:hover[disabled]@sm')[0].stateToken).toBe(':hover[disabled]@sm')
    })
    test.concurrent('at', () => {
        expect(createCSS().generate('b:1|solid|blue-60:hover[disabled]@sm')[0].atToken).toBe('@sm')
    })
    test.concurrent('empty at', () => {
        expect(createCSS().generate('text:center@')[0].atToken).toBe('@')
    })
})

describe.concurrent('value components', () => {
    test.concurrent('basic', () => {
        const cls = 'font:32@sm'
        const rule = createCSS().generate(cls)[0]
        expect(rule.valueComponents).toEqual([{
            text: '2rem',
            token: '32',
            type: 'number',
            value: 2,
            unit: 'rem'
        }])
        expect(rule.atToken).toBe('@sm')
    })

    test.concurrent('shorthand', () => {
        expect(createCSS().generate('b:1|solid|#000000')[0].valueComponents)
            .toStrictEqual([
                { token: '1', text: '0.0625rem', type: 'number', unit: 'rem', value: 0.0625 },
                { token: '|', text: ' ', type: 'separator', value: ' ' },
                { token: 'solid', text: 'solid', type: 'string', value: 'solid' },
                { token: '|', text: ' ', type: 'separator', value: ' ' },
                { token: '#000000', text: '#000000', type: 'string', value: '#000000' }
            ])
    })

    test.concurrent('function', () => {
        expect(createCSS().generate('bg:rgb(125,125,0)!')[0].valueComponents).toStrictEqual([
            {
                type: 'function',
                name: 'rgb',
                symbol: '(',
                children: [
                    { value: 125, type: 'number', token: '125', text: '125', unit: '' },
                    { type: 'separator', value: ',', text: ',', token: ',' },
                    { value: 125, type: 'number', token: '125', text: '125', unit: '' },
                    { type: 'separator', value: ',', text: ',', token: ',' },
                    { value: 0, type: 'number', token: '0', text: '0', unit: '' }
                ],
                token: 'rgb(125,125,0)',
                text: 'rgb(125,125,0)'
            }
        ])
    })

    test.concurrent('gradient', () => {
        expect(createCSS().generate('gradient(#000,#fff)')[0].valueComponents).toStrictEqual([
            {
                text: 'gradient(#000,#fff)',
                token: 'gradient(#000,#fff)',
                type: 'function',
                name: 'gradient',
                symbol: '(',
                children: [
                    { value: '#000', type: 'string', token: '#000', text: '#000' },
                    { type: 'separator', value: ',', text: ',', token: ',' },
                    { value: '#fff', type: 'string', token: '#fff', text: '#fff' }
                ]
            }
        ])
    })
})