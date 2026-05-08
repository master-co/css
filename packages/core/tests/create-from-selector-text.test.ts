import { test, expect, describe } from 'vitest'
import { createCSS, UtilityType } from '../src'

function mainStyle(name: string, rules: any[]) {
    return { name, type: UtilityType.Static, layer: 'main' as const, rules }
}

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
    const rules = createCSS({ utilities: [mainStyle('light', [
        { selector: '&', declarations: { display: 'block' } },
        { selector: '&', declarations: { 'font-weight': '700' } }
    ])] }).createFromSelectorText('.light .light\@light')

    expect(rules?.[0]).toMatchObject({ name: 'light' })
    expect(rules?.[0]?.text).toBe('.light{display:block}.light{font-weight:700}')
})

test.concurrent('component and mode', () => {
    expect(createCSS({ utilities: [mainStyle('btn', [
        { selector: '&', declarations: { display: 'block' } }
    ])] }).createFromSelectorText('.light .btn')?.[0]).toMatchObject({ name: 'btn', selectorText: '.btn' })
})

test.concurrent('component selector variant', () => {
    const rules = createCSS({ utilities: [mainStyle('btn', [
        { selector: '&:disabled>span', declarations: { display: 'block' } }
    ])] }).createFromSelectorText('.btn\\:hover:hover:disabled>span')

    expect(rules?.[0]).toMatchObject({ name: 'btn:hover' })
    expect(rules?.[0]?.text).toBe('.btn\\:hover:hover:disabled>span{display:block}')
})

describe('group selector', () => {
    const config = { selectorTokens: {
            '::both': '::before,::after',
        }, utilities: [mainStyle('btn', [
            { selector: '&::before,&::after', declarations: { display: 'block' } }
        ])] }
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
