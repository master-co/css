import { describe, expect, test } from 'vitest'
import { createCSS } from '../src'
import { clonePlan, createCSSWithVariables, createDefaultCSS } from './helpers/css-tester'

describe.concurrent('migrated complex utility parity', () => {
    test('keeps grouped declarations generated utilities and invalid group recovery', () => {
        const css = createDefaultCSS()

        expect(css.create('{color:black!;bb:2px|solid}')?.text)
            .toBe('.\\{color\\:black\\!\\;bb\\:2px\\|solid\\}{color:oklch(0% 0 none)!important;border-bottom:2px solid}')
        expect(css.create('{pt:calc(2.5em+3.75rem);mt:-3.75rem}_:where(h1,h2,h3,h4,h5,h6)')?.text)
            .toBe('.\\{pt\\:calc\\(2\\.5em\\+3\\.75rem\\)\\;mt\\:-3\\.75rem\\}_\\:where\\(h1\\,h2\\,h3\\,h4\\,h5\\,h6\\) :where(h1,h2,h3,h4,h5,h6){padding-top:calc(2.5em + 3.75rem);margin-top:-3.75rem}')
        expect(css.create('{line-height:calc(32-16);font-size:calc(2rem-1rem)}')?.text)
            .toBe('.\\{line-height\\:calc\\(32-16\\)\\;font-size\\:calc\\(2rem-1rem\\)\\}{line-height:calc(32 - 16);font-size:calc(2rem - 1rem)}')
        expect(css.create('{m:8x;leading:1.5}')?.text)
            .toBe('.\\{m\\:8x\\;leading\\:1\\.5\\}{margin:2rem;line-height:1.5}')
        expect(css.create('{form}')?.text).toBe('')
        expect(css.create('{form;block}')?.text).toBe('.\\{form\\;block\\}{display:block}')
    })

    test('keeps grouped declaration important propagation', () => {
        const plan = clonePlan()
        plan.settings = {
            ...(plan.settings || {}),
            important: true
        }

        expect(createCSS(plan).create('{color:black!;bb:2px|solid}')?.text)
            .toBe('.\\{color\\:black\\!\\;bb\\:2px\\|solid\\}{color:oklch(0% 0 none)!important;border-bottom:2px solid!important}')
    })

    test('keeps grouped gradient values with custom variables and quoted separators', () => {
        const css = createCSSWithVariables([
            { name: 'G-10', namespace: 'G', key: '10', type: 'string', value: '#333333' },
            { name: 'G-20', namespace: 'G', key: '20', type: 'string', value: '#666666' },
            { name: 'G-30', namespace: 'G', key: '30', type: 'string', value: '#999999' }
        ])
        const rule = css.create('{content:\'\';abs;inset:0;bg:linear-gradient(90deg,G-10/.1|10%,G-20/.2|20%,G-30/.3|60%,white/.4)}::after')

        expect(rule?.text).toContain('content:\'\'')
        expect(rule?.text).toContain('position:absolute')
        expect(rule?.text).toContain('inset:0')
        expect(rule?.text).toContain('background-image:linear-gradient(90deg,color-mix(in oklab,var(--G-10) 10%,transparent) 10%')
        expect(rule?.text).toContain('color-mix(in oklab,var(--G-20) 20%,transparent) 20%')
        expect(rule?.text).toContain('color-mix(in oklab,var(--G-30) 30%,transparent) 60%')
        expect(rule?.text).toContain('color-mix(in oklab,oklch(100% 0 none) 40%,transparent)')
        expect(createDefaultCSS().create('{content:\'\';block}::after@light')?.text)
            .toBe('@media (prefers-color-scheme:light){.\\{content\\:\\\'\\\'\\;block\\}\\:\\:after\\@light::after{content:\'\';display:block}}')
    })

    test('keeps grid-col span shorthand and removes long alias', () => {
        const css = createDefaultCSS()

        expect(css.create('grid-col-span:2')?.text).toBe('.grid-col-span\\:2{grid-column:span 2/span 2}')
        expect(css.create('grid-column-span:2')).toBeUndefined()
    })

    test('keeps inset utilities values and priority order', () => {
        const css = createDefaultCSS()

        expect(css.create('top:5x')?.text).toBe('.top\\:5x{top:1.25rem}')
        expect(css.create('bottom:2.5x')?.text).toBe('.bottom\\:2\\.5x{bottom:0.625rem}')
        expect(css.create('inset:4x')?.text).toBe('.inset\\:4x{inset:1rem}')
        expect(css.create('left:1.875rem')?.text).toBe('.left\\:1\\.875rem{left:1.875rem}')
        expect(css.create('right:max(0px,calc(50%-45.3125rem))')?.text)
            .toBe('.right\\:max\\(0px\\,calc\\(50\\%-45\\.3125rem\\)\\){right:max(0px,calc(50% - 45.3125rem))}')
        expect(css.create('top:0')?.text).toBe('.top\\:0{top:0}')
        expect(css.create('left:0')?.text).toBe('.left\\:0{left:0}')
        expect(css.create('right:0')?.text).toBe('.right\\:0{right:0}')
        expect(css.create('bottom:0')?.text).toBe('.bottom\\:0{bottom:0}')

        const ordered = createDefaultCSS()
        ordered.add('top:0', 'left:0', 'inset:0', 'right:0', 'bottom:0')
        expect(ordered.utilitiesLayer.rules.map(({ name }) => name)).toEqual([
            'inset:0',
            'bottom:0',
            'left:0',
            'right:0',
            'top:0'
        ])
    })

    test('keeps size max and min single-value utility parsing', () => {
        const css = createDefaultCSS()

        expect(css.create('size:4x')?.declarations).toStrictEqual({ width: '1rem', height: '1rem' })
        expect(css.create('size:md')?.declarations).toStrictEqual({
            width: 'var(--container-md)',
            height: 'var(--container-md)'
        })
        expect(css.create('size:min(2.5x,calc(6.25x-2.5x))')?.declarations)
            .toStrictEqual({
                width: 'min(0.625rem,calc(1.5625rem - 0.625rem))',
                height: 'min(0.625rem,calc(1.5625rem - 0.625rem))'
            })
        expect(css.create('max:4x')?.declarations).toStrictEqual({ 'max-width': '1rem', 'max-height': '1rem' })
        expect(css.create('min:4x')?.declarations).toStrictEqual({ 'min-width': '1rem', 'min-height': '1rem' })
        expect(css.create('size:4x|8x')).toBeUndefined()
        expect(css.create('size:var(--w)|var(--h)')).toBeUndefined()
        expect(css.create('max:4x|8x')).toBeUndefined()
        expect(css.create('min:4x|8x')).toBeUndefined()
    })

    test('keeps transition multi-value syntax and rejects removed shorthand prefix', () => {
        const css = createDefaultCSS()

        expect(css.create('~transform|.1s|ease-out,width|.1s|ease-out')).toBeUndefined()
        expect(css.create('transition:transform|.1s|ease-out,width|.1s|ease-out')?.text)
            .toBe('.transition\\:transform\\|\\.1s\\|ease-out\\,width\\|\\.1s\\|ease-out{transition:transform 0.1s ease-out,width 0.1s ease-out}')
    })

    test('keeps font family feature weight and shorthand utilities', () => {
        const css = createCSSWithVariables([
            { name: 'font-feature-tabular', namespace: 'font-feature', key: 'tabular', type: 'string', value: '\'tnum\'' }
        ])

        expect(css.create('font:italic|1.2rem|sans')?.text)
            .toBe('.font\\:italic\\|1\\.2rem\\|sans{font:italic 1.2rem var(--font-family-sans)}')
        expect(css.create('font:sans')?.text).toBe('.font\\:sans{font-family:var(--font-family-sans)}')
        expect(css.create('font-bolder')?.text).toBe('.font-bolder{font-weight:bolder}')
        expect(css.create('font:thin')?.text).toBe('.font\\:thin{font-weight:var(--font-weight-thin)}')
        expect(css.create('font-feature-settings:\'cv02\',\'cv03\',\'cv04\',\'cv11\'')?.text)
            .toBe('.font-feature-settings\\:\\\'cv02\\\'\\,\\\'cv03\\\'\\,\\\'cv04\\\'\\,\\\'cv11\\\'{font-feature-settings:\'cv02\',\'cv03\',\'cv04\',\'cv11\'}')
        expect(css.create('font-feature-settings:tabular')?.text)
            .toBe('.font-feature-settings\\:tabular{font-feature-settings:var(--font-feature-tabular)}')
        expect(css.create('font-feature-settings:font-feature-tabular')?.text)
            .toBe('.font-feature-settings\\:font-feature-tabular{font-feature-settings:var(--font-feature-tabular)}')
    })
})
