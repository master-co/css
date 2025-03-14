import { test, expect, describe } from 'vitest'
import { MasterCSS } from '../../src'

test.concurrent('basic', () => {
    expect(new MasterCSS().createFromSelectorText('.font\\:heavy')?.[0]).toMatchObject({ name: 'font:heavy' })
})

test.concurrent('descendant selector', () => {
    expect(new MasterCSS().createFromSelectorText('.hidden\\_button\\[disabled\\] button[disabled]')?.[0]).toMatchObject({ name: 'hidden_button[disabled]' })
})

test.concurrent('where', () => {
    expect(new MasterCSS().createFromSelectorText('.ml\\:-50\\_\\:where(\\.code\\,\\.codeTabs\\,\\.demo\\)\\@\\<md')?.[0]).toMatchObject({ name: 'ml:-50_:where(.code,.codeTabs,.demo)@<md' })
})

test.concurrent('mode', () => {
    expect(new MasterCSS().createFromSelectorText('.light .hidden\@light')?.[0]).toMatchObject({ name: 'hidden@light' })
})

test.concurrent('component conflicts with the mode', () => {
    expect(new MasterCSS({
        components: {
            'light': 'block font:bold'
        }
    }).createFromSelectorText('.light .light\@light')?.[0]).toMatchObject({ name: '{block;font:bold}', fixedClass: 'light' })
})

test.concurrent('component and mode', () => {
    expect(new MasterCSS({
        components: {
            'btn': 'block'
        }
    }).createFromSelectorText('.light .btn')?.[0]).toMatchObject({ name: 'block', fixedClass: 'btn' })
})

describe('group selector', () => {
    const config = {
        selectors: {
            '::both': ['::before', '::after'],
        },
        components: {
            btn: 'block::both'
        }
    }

    test.concurrent('general', () => {
        expect(new MasterCSS(config).createFromSelectorText('.block\\:\\:both::before, .block\\:\\:both::after')?.[0]).toMatchObject({ name: 'block::both' })
    })

    test.concurrent('components', () => {
        expect(new MasterCSS(config).createFromSelectorText('.btn::before,.btn::after')?.[0]).toMatchObject({
            name: 'block::both',
            fixedClass: 'btn',
            nodes: [
                {
                    selectorText: '.btn::before,.btn::after',
                    text: '.btn::before,.btn::after{display:block}',
                }
            ]
        })
    })
})