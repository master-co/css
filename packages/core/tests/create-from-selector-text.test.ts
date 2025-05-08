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
    expect(createCSS({
        components: {
            'light': 'block font:bold'
        }
    }).createFromSelectorText('.light .light\@light')?.[0]).toMatchObject({ name: 'block', fixedClass: 'light' })
    expect(createCSS({
        components: {
            'light': 'block font:bold'
        }
    }).createFromSelectorText('.light .light\@light')?.[1]).toMatchObject({ name: 'font:bold', fixedClass: 'light' })
})

test.concurrent('component and mode', () => {
    expect(createCSS({
        components: {
            'btn': 'block'
        }
    }).createFromSelectorText('.light .btn')?.[0]).toMatchObject({ name: 'block', fixedClass: 'btn' })
})

describe('group selector', () => {
    const config = {
        selectors: {
            '::both': '::before,::after',
        },
        components: {
            btn: 'block::both'
        }
    }
    test.concurrent('general', () => {
        expect(createCSS(config).createFromSelectorText('.block\\:\\:both::before, .block\\:\\:both::after')?.[0]).toMatchObject({ name: 'block::both' })
    })

    test.concurrent('components', () => {
        expect(createCSS(config).createFromSelectorText('.btn::before,.btn::after')?.[0]).toMatchObject({
            name: 'block::both',
            fixedClass: 'btn',
            selectorText: '.btn::before,.btn::after',
            text: '.btn::before,.btn::after{display:block}',
        })
    })
})