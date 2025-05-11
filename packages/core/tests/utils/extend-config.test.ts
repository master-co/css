import { expect, test } from 'vitest'
import { extendConfig } from '../../src'

test.concurrent('basic', () => {
    expect(extendConfig(
        { variables: { primary: { '': '#000' } } },
        { variables: { primary: '#fff' } }
    )).toEqual(
        { variables: { primary: { '': '#fff' } } }
    )
})

test.concurrent('nest', () => {
    expect(extendConfig(
        { variables: { primary: { '': '#000', 1: '#111' } } },
        { variables: { 'primary-1': '#222' } }
    )).toEqual(
        { variables: { primary: { '': '#000', 1: { '': '#111' } }, 'primary-1': { '': '#222' } } }
    )
})

test.concurrent('modes', () => {
    expect(extendConfig(
        { modes: { light: { primary: { '': '#111' } }, dark: { primary: { '': '#222' } } } },
        { modes: { light: { secondary: { '': '#333' } }, dark: { secondary: { '': '#444' } } } }
    )).toEqual(
        {
            modes: {
                light: { primary: { '': '#111' }, secondary: { '': '#333' } },
                dark: { primary: { '': '#222' }, secondary: { '': '#444' } }
            }
        })
})