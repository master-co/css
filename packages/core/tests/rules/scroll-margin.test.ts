import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('checks scroll-margin order', () => {
    expect(createCSS().add('scroll-mx:0', 'scroll-ml:0', 'scroll-mr:0', 'scroll-m:0', 'scroll-mt:0', 'scroll-mb:0', 'scroll-my:0').generalLayer.rules)
        .toMatchObject([
            { name: 'scroll-m:0' },
            { name: 'scroll-mx:0' },
            { name: 'scroll-my:0' },
            { name: 'scroll-mb:0' },
            { name: 'scroll-ml:0' },
            { name: 'scroll-mr:0' },
            { name: 'scroll-mt:0' }
        ])
})

it.concurrent('validates scroll-margin rules', () => {
    expect(createCSS().create('scroll-ml:16')?.text).toContain('scroll-margin-left:1rem')
    expect(createCSS().create('scroll-mr:16')?.text).toContain('scroll-margin-right:1rem')
    expect(createCSS().create('scroll-mt:16')?.text).toContain('scroll-margin-top:1rem')
    expect(createCSS().create('scroll-mb:16')?.text).toContain('scroll-margin-bottom:1rem')
    expect(createCSS().create('scroll-m:16')?.text).toContain('scroll-margin:1rem')
    expect(createCSS().create('scroll-mx:16')?.text).toContain('scroll-margin-left:1rem;scroll-margin-right:1rem')
    expect(createCSS().create('scroll-my:16')?.text).toContain('scroll-margin-top:1rem;scroll-margin-bottom:1rem')
    expect(createCSS().create('scroll-margin-x:16')?.text).toContain('scroll-margin-left:1rem;scroll-margin-right:1rem')
    expect(createCSS().create('scroll-margin-y:16')?.text).toContain('scroll-margin-top:1rem;scroll-margin-bottom:1rem')
})