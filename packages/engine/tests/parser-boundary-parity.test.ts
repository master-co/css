import { describe, expect, test } from 'vitest'
import { MasterCSS } from '../src'
import { cloneManifest, createDefaultCSS, createManifestWithSemanticUtilities } from './helpers/css-tester'

describe.concurrent('migrated parser boundary parity', () => {
    test('parses primitive values with the old public parse-value expectations', () => {
        const css = createDefaultCSS()

        expect(css.parseValue('.5', '')).toEqual({ token: '.5', type: 'number', value: 0.5, unit: '' })
        expect(css.parseValue('0.5', '')).toEqual({ token: '0.5', type: 'number', value: 0.5, unit: '' })
        expect(css.parseValue('text', '')).toEqual({ token: 'text', type: 'string', value: 'text' })
    })

    test('keeps selector variant aliases, pseudos, shorthands, and descendants intact', () => {
        const manifest = cloneManifest()
        manifest.variants = [
            ...(manifest.variants || []),
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
        const css = MasterCSS.create({ manifest: manifest })

        expect(css.createRule('hidden:hover')?.text).toBe('.hidden\\:hover:hover{display:none}')
        expect(css.createRule('hidden>:custom')?.text).toBe('.hidden\\>\\:custom>div>:first-child+button{display:none}')
        expect(css.createRule('hidden~:custom-1')?.text).toBe('.hidden\\~\\:custom-1~div{display:none}')
        expect(css.createRule('hidden::slider-thumb')?.text).toBe('.hidden\\:\\:slider-thumb::-webkit-slider-thumb{display:none}')
        expect(css.createRule('bg:#000:hover_.feature__tab-title')?.text)
            .toBe('.bg\\:\\#000\\:hover_\\.feature__tab-title:hover .feature__tab-title{background-color:#000}')
        expect(css.createRule('hidden:first')?.text).toBe('.hidden\\:first:first-child{display:none}')
        expect(css.createRule('hidden:last')?.text).toBe('.hidden\\:last:last-child{display:none}')
        expect(css.createRule('hidden:even')?.text).toBe('.hidden\\:even:nth-child(2n){display:none}')
        expect(css.createRule('hidden:odd')?.text).toBe('.hidden\\:odd:nth-child(odd){display:none}')
        expect(css.createRule('hidden:nth(2)')?.text).toBe('.hidden\\:nth\\(2\\):nth-child(2){display:none}')
        expect(css.createRule('hidden:first:focus')?.text).toBe('.hidden\\:first\\:focus:first-child:focus{display:none}')
        expect(css.createRule('uppercase::first-letter')?.text)
            .toBe('.uppercase\\:\\:first-letter::first-letter{text-transform:uppercase}')

        css.ensureClassRules('hidden:hocus')
        expect(css.utilitiesLayer.text)
            .toBe('@layer utilities{.hidden\\:hocus:hover{display:none}.hidden\\:hocus:focus-visible{display:none}}')
    })

    test('recovers generated utilities from selector text across modes scope and grouped selectors', () => {
        const modeManifest = cloneManifest()
        modeManifest.settings = {
            ...(modeManifest.settings || {}),
            scope: '#app',
            modeTrigger: 'class',
            modes: ['light', 'dark']
        }

        const css = MasterCSS.create({ manifest: modeManifest })
        expect(css.createRulesFromSelectorText('.font\\:heavy')?.[0]).toMatchObject({ name: 'font:heavy' })
        expect(css.createRulesFromSelectorText('.hidden\\_button\\[disabled\\] button[disabled]')?.[0])
            .toMatchObject({ name: 'hidden_button[disabled]' })
        expect(css.createRulesFromSelectorText('.ml\\:-50px\\_\\:where\\(\\.code\\,\\.codeTabs\\,\\.demo\\)\\@\\<md')?.[0])
            .toMatchObject({ name: 'ml:-50px_:where(.code,.codeTabs,.demo)@<md' })
        expect(css.createRulesFromSelectorText('.light .hidden\\@light')?.[0]).toMatchObject({ name: 'hidden@light' })
        expect(css.createRulesFromSelectorText('.light #app .hidden\\@light')?.[0]).toMatchObject({ name: 'hidden@light' })
        expect(css.createRulesFromSelectorText('.active .hidden\\:within\\(\\.active\\)')?.[0])
            .toMatchObject({ name: 'hidden:within(.active)' })
        expect(css.createRulesFromSelectorText('.dark #app .active .hidden\\:within\\(\\.active\\)\\@dark')?.[0])
            .toMatchObject({ name: 'hidden:within(.active)@dark' })

        const classModePlan = cloneManifest()
        classModePlan.settings = {
            ...(classModePlan.settings || {}),
            modeTrigger: 'class',
            modes: ['light', 'dark']
        }
        const componentManifest = createManifestWithSemanticUtilities([
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
        const componentCSS = MasterCSS.create({ manifest: componentManifest })
        const lightRules = componentCSS.createRulesFromSelectorText('.light .light\\@light')
        expect(lightRules?.[0]).toMatchObject({ name: 'light' })
        expect(lightRules?.[0]?.text).toBe('.light{display:block}.light{font-weight:700}')

        const btnRules = componentCSS.createRulesFromSelectorText('.btn\\:hover:hover:disabled>span')
        expect(btnRules?.[0]).toMatchObject({ name: 'btn:hover' })
        expect(btnRules?.[0]?.text).toBe('.btn\\:hover:hover:disabled>span{display:block}')

        const groupedPlan = cloneManifest()
        groupedPlan.variants = [
            ...(groupedPlan.variants || []),
            { token: '::both', branches: [{ selector: '&::before,&::after' }] }
        ]
        const groupedCSS = MasterCSS.create({
            manifest: createManifestWithSemanticUtilities([
            {
                name: 'btn',
                rules: [{ selector: '&::before,&::after', declarations: { display: 'block' } }]
            }
        ], groupedPlan)
        })

        expect(groupedCSS.createRulesFromSelectorText('.block\\:\\:both::before, .block\\:\\:both::after')?.[0])
            .toMatchObject({ name: 'block::both' })
        expect(groupedCSS.createRulesFromSelectorText('.btn::before,.btn::after')?.[0]).toMatchObject({ name: 'btn' })
        expect(groupedCSS.createRulesFromSelectorText('.btn::before,.btn::after')?.[0]?.text)
            .toBe('.btn::before,.btn::after{display:block}')
    })
})
