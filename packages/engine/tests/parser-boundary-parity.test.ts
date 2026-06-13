import { describe, expect, test } from 'vitest'
import { createCSS } from '../src'
import { clonePlan, createDefaultCSS, createPlanWithStaticUtilities } from './helpers/css-tester'

describe.concurrent('migrated parser boundary parity', () => {
    test('parses primitive values with the old public parse-value expectations', () => {
        const css = createDefaultCSS()

        expect(css.parseValue('.5', '')).toEqual({ token: '.5', type: 'number', value: 0.5, unit: '' })
        expect(css.parseValue('0.5', '')).toEqual({ token: '0.5', type: 'number', value: 0.5, unit: '' })
        expect(css.parseValue('text', '')).toEqual({ token: 'text', type: 'string', value: 'text' })
    })

    test('keeps selector variant aliases, pseudos, shorthands, and descendants intact', () => {
        const plan = clonePlan()
        plan.variants = [
            ...(plan.variants || []),
            { token: ':custom', branches: [{ selector: '&div>:first-child+button' }] },
            { token: ':custom-1', branches: [{ selector: '&div' }] },
            { token: '::slider-thumb', branches: [{ selector: '&::-webkit-slider-thumb' }] },
            {
                token: ':hocus',
                branches: [
                    { selector: '&:hover' },
                    { selector: '&:focus-visible' }
                ]
            }
        ]
        const css = createCSS(plan)

        expect(css.create('hidden:hover')?.text).toBe('.hidden\\:hover:hover{display:none}')
        expect(css.create('hidden>:custom')?.text).toBe('.hidden\\>\\:custom>div>:first-child+button{display:none}')
        expect(css.create('hidden~:custom-1')?.text).toBe('.hidden\\~\\:custom-1~div{display:none}')
        expect(css.create('hidden::slider-thumb')?.text).toBe('.hidden\\:\\:slider-thumb::-webkit-slider-thumb{display:none}')
        expect(css.create('bg:#000:hover_.feature__tab-title')?.text)
            .toBe('.bg\\:\\#000\\:hover_\\.feature__tab-title:hover .feature__tab-title{background-color:#000}')
        expect(css.create('hidden:first')?.text).toBe('.hidden\\:first:first-child{display:none}')
        expect(css.create('hidden:last')?.text).toBe('.hidden\\:last:last-child{display:none}')
        expect(css.create('hidden:even')?.text).toBe('.hidden\\:even:nth-child(2n){display:none}')
        expect(css.create('hidden:odd')?.text).toBe('.hidden\\:odd:nth-child(odd){display:none}')
        expect(css.create('hidden:nth(2)')?.text).toBe('.hidden\\:nth\\(2\\):nth-child(2){display:none}')
        expect(css.create('hidden:first:focus')?.text).toBe('.hidden\\:first\\:focus:first-child:focus{display:none}')
        expect(css.create('uppercase::first-letter')?.text)
            .toBe('.uppercase\\:\\:first-letter::first-letter{text-transform:uppercase}')

        css.add('hidden:hocus')
        expect(css.utilitiesLayer.text)
            .toBe('@layer utilities{.hidden\\:hocus:hover{display:none}.hidden\\:hocus:focus-visible{display:none}}')
    })

    test('recovers generated utilities from selector text across modes scope and grouped selectors', () => {
        const modePlan = clonePlan()
        modePlan.settings = {
            ...(modePlan.settings || {}),
            scope: '#app',
            modeTrigger: 'class',
            modes: ['light', 'dark']
        }

        const css = createCSS(modePlan)
        expect(css.createFromSelectorText('.font\\:heavy')?.[0]).toMatchObject({ name: 'font:heavy' })
        expect(css.createFromSelectorText('.hidden\\_button\\[disabled\\] button[disabled]')?.[0])
            .toMatchObject({ name: 'hidden_button[disabled]' })
        expect(css.createFromSelectorText('.ml\\:-50\\_\\:where\\(\\.code\\,\\.codeTabs\\,\\.demo\\)\\@\\<md')?.[0])
            .toMatchObject({ name: 'ml:-50_:where(.code,.codeTabs,.demo)@<md' })
        expect(css.createFromSelectorText('.light .hidden\\@light')?.[0]).toMatchObject({ name: 'hidden@light' })
        expect(css.createFromSelectorText('.light #app .hidden\\@light')?.[0]).toMatchObject({ name: 'hidden@light' })
        expect(css.createFromSelectorText('.active .hidden\\:within\\(\\.active\\)')?.[0])
            .toMatchObject({ name: 'hidden:within(.active)' })
        expect(css.createFromSelectorText('.dark #app .active .hidden\\:within\\(\\.active\\)\\@dark')?.[0])
            .toMatchObject({ name: 'hidden:within(.active)@dark' })

        const classModePlan = clonePlan()
        classModePlan.settings = {
            ...(classModePlan.settings || {}),
            modeTrigger: 'class',
            modes: ['light', 'dark']
        }
        const componentPlan = createPlanWithStaticUtilities([
            {
                name: 'light',
                rules: [
                    { declarations: { display: 'block' } },
                    { declarations: { 'font-weight': '700' } }
                ]
            },
            {
                name: 'btn',
                rules: [{ selector: '&:disabled>span', declarations: { display: 'block' } }]
            }
        ], classModePlan)
        const componentCSS = createCSS(componentPlan)
        const lightRules = componentCSS.createFromSelectorText('.light .light\\@light')
        expect(lightRules?.[0]).toMatchObject({ name: 'light' })
        expect(lightRules?.[0]?.text).toBe('.light{display:block}.light{font-weight:700}')

        const btnRules = componentCSS.createFromSelectorText('.btn\\:hover:hover:disabled>span')
        expect(btnRules?.[0]).toMatchObject({ name: 'btn:hover' })
        expect(btnRules?.[0]?.text).toBe('.btn\\:hover:hover:disabled>span{display:block}')

        const groupedPlan = clonePlan()
        groupedPlan.variants = [
            ...(groupedPlan.variants || []),
            { token: '::both', branches: [{ selector: '&::before,&::after' }] }
        ]
        const groupedCSS = createCSS(createPlanWithStaticUtilities([
            {
                name: 'btn',
                rules: [{ selector: '&::before,&::after', declarations: { display: 'block' } }]
            }
        ], groupedPlan))

        expect(groupedCSS.createFromSelectorText('.block\\:\\:both::before, .block\\:\\:both::after')?.[0])
            .toMatchObject({ name: 'block::both' })
        expect(groupedCSS.createFromSelectorText('.btn::before,.btn::after')?.[0]).toMatchObject({ name: 'btn' })
        expect(groupedCSS.createFromSelectorText('.btn::before,.btn::after')?.[0]?.text)
            .toBe('.btn::before,.btn::after{display:block}')
    })
})
