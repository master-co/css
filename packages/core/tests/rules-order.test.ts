import { it, test, expect } from 'vitest'
import { createCSS } from '../src'
import shuffle from 'shuffle-array'

it.concurrent('checks that different input sources should have the same output', () => {
    const input = [
        'px:0', 'pl:0', 'pr:0', 'p:0', 'pt:0', 'pb:0', 'py:0',
        'mx:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'my:0',
        'font:12',
        'font:medium',
        'text:center',
        'fixed',
        'block',
        'round',
        'b:0'
    ]
    const output = [
        // utilities
        { name: 'block' },
        { name: 'fixed' },
        { name: 'round' },
        // native shorthand
        { name: 'b:0' },
        { name: 'm:0' },
        { name: 'p:0' },
        // custom shorthand
        { name: 'mx:0' },
        { name: 'my:0' },
        { name: 'px:0' },
        { name: 'py:0' },
        // native
        { name: 'font:12' },
        { name: 'font:medium' },
        { name: 'mb:0' },
        { name: 'ml:0' },
        { name: 'mr:0' },
        { name: 'mt:0' },
        { name: 'pb:0' },
        { name: 'pl:0' },
        { name: 'pr:0' },
        { name: 'pt:0' },
        { name: 'text:center' },
    ]
    for (let i = 0; i < 10; i++) {
        expect(createCSS().add(...shuffle([...input])).generalLayer.rules).toMatchObject(output)
    }
})

it.concurrent('checks style declarations', () => {
    const input = [
        'font:12', 'font:32@md', 'font:24@sm', 'm:32', 'block', 'px:16', 'bg:blue-60:hover', 'round', 'mb:48'
    ]
    const output = [
        { name: 'block' },
        { name: 'round' },
        { name: 'm:32' },
        { name: 'px:16' },
        { name: 'font:12' },
        { name: 'mb:48' },
        { name: 'bg:blue-60:hover' },
        { name: 'font:24@sm' },
        { name: 'font:32@md' }
    ]
    for (let i = 0; i < 10; i++) {
        expect(createCSS().add(...shuffle([...input])).generalLayer.rules).toMatchObject(output)
    }
})

it.concurrent('checks media order', () => {
    const input = [
        'min-w:206', '{flex-row}@xs', 'jc:flex-end@xs', 'hidden@tablet&<desktop', '{flex-row}@2xs&<xs'
    ]
    const output = [
        { name: 'min-w:206' },
        { name: '{flex-row}@xs' },
        { name: 'jc:flex-end@xs' },
        { name: 'hidden@tablet&<desktop' },
        { name: '{flex-row}@2xs&<xs' }
    ]
    expect(createCSS({
        at: {
            tablet: 391,
            desktop: 1025,
        }
    }).add(...shuffle([...input])).generalLayer.rules).toMatchObject(output)
})