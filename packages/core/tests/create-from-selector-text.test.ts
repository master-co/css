import { test, expect, describe } from 'vitest'
import { createCSS } from '../src'

test.concurrent('basic', () => {
    expect(createCSS().createFromSelectorText('.font\\:heavy')?.[0]).toMatchObject({ name: 'font:heavy' })
})

test.concurrent('descendant selector', () => {
    expect(createCSS().createFromSelectorText('.hidden\\_button\\[disabled\\] button[disabled]')?.[0]).toMatchObject({ name: 'hidden_button[disabled]' })
})

test.concurrent('where', () => {
    expect(createCSS().createFromSelectorText('.ml\\:-50\\_\\:where(\\.code\\,\\.codeTabs\\,\\.demo\\)\\@\\<md')?.[0]).toMatchObject({ name: 'ml:-50_:where(.code,.codeTabs,.demo)@<md' })
})

test.concurrent('mode', () => {
    expect(createCSS().createFromSelectorText('.light .hidden\@light')?.[0]).toMatchObject({ name: 'hidden@light' })
})

test.concurrent('mode and scope', () => {
    expect(createCSS({ scope: '#app' }).createFromSelectorText('.light #app .hidden\@light')?.[0]).toMatchObject({ name: 'hidden@light' })
})

test.concurrent(':within', () => {
    expect(createCSS().createFromSelectorText('.active .hidden\\:within\\(\\.active\\)')?.[0]).toMatchObject({ name: 'hidden:within(.active)' })
})

test.concurrent(':within and mode', () => {
    expect(createCSS().createFromSelectorText('.dark .active .hidden\\:within\\(\\.active\\)\\@dark')?.[0]).toMatchObject({ name: 'hidden:within(.active)@dark' })
})

test.concurrent(':within and mode and scope', () => {
    expect(createCSS({ scope: '#app' }).createFromSelectorText('.dark #app .active .hidden\\:within\\(\\.active\\)\\@dark')?.[0]).toMatchObject({ name: 'hidden:within(.active)@dark' })
})

test.concurrent('component conflicts with the mode', () => {
    const rules = createCSS({ components: { 'light': [
        { selector: '&', declarations: { display: 'block' } },
        { selector: '&', declarations: { 'font-weight': '700' } }
    ] } }).createFromSelectorText('.light .light\@light')

    expect(rules?.[0]).toMatchObject({ name: 'light' })
    expect(rules?.[0]?.text).toBe('.light{display:block}')
    expect(rules?.[1]).toMatchObject({ name: 'light' })
    expect(rules?.[1]?.text).toBe('.light{font-weight:700}')
})

test.concurrent('component and mode', () => {
    expect(createCSS({ components: { 'btn': [
        { selector: '&', declarations: { display: 'block' } }
    ] } }).createFromSelectorText('.light .btn')?.[0]).toMatchObject({ name: 'btn', selectorText: '.btn' })
})

describe('group selector', () => {
    const config = { selectorTokens: {
            '::both': '::before,::after',
        }, components: { btn: [
            { selector: '&::before,&::after', declarations: { display: 'block' } }
        ] } }
    test.concurrent('utilities', () => {
        expect(createCSS(config).createFromSelectorText('.block\\:\\:both::before, .block\\:\\:both::after')?.[0]).toMatchObject({ name: 'block::both' })
    })

    test.concurrent('components', () => {
        expect(createCSS(config).createFromSelectorText('.btn::before,.btn::after')?.[0]).toMatchObject({
            name: 'btn',
        })
        expect(createCSS(config).createFromSelectorText('.btn::before,.btn::after')?.[0]?.text).toBe('.btn::before,.btn::after{display:block}')
    })
})
