import { it, test, expect } from 'vitest'
import config from './config'
import createCSSWithTheme from './helpers/create-css-with-theme'

test.concurrent('hidden:hover', ({ task }) => {
    expect(createCSSWithTheme(config).create(task.name)?.text).toBe('.hidden\\:hover:hover{display:none}')
})

test.concurrent('selectors', () => {
    expect(createCSSWithTheme(config).create('hidden>:custom')?.text).toBe('.hidden\\>\\:custom>div>:first-child+button{display:none}')
    expect(createCSSWithTheme(config).create('hidden~:custom-1')?.text).toBe('.hidden\\~\\:custom-1~div{display:none}')
    expect(createCSSWithTheme(config).create('hidden::slider-thumb')?.text).toBe('.hidden\\:\\:slider-thumb::-webkit-slider-thumb{display:none}')
    expect(createCSSWithTheme().create('bg:#000:hover_.feature__tab-title')?.text).toBe('.bg\\:\\#000\\:hover_\\.feature__tab-title:hover .feature__tab-title{background-color:#000}')
})

test.concurrent('multi-branch selector variants', () => {
    const css = createCSSWithTheme({
        variants: [
            {
                token: ':hocus',
                branches: [
                    { selector: '&:hover' },
                    { selector: '&:focus-visible' }
                ]
            }
        ]
    }).add('hidden:hocus')

    expect(css.utilitiesLayer.text).toBe('@layer utilities{.hidden\\:hocus:hover{display:none}.hidden\\:hocus:focus-visible{display:none}}')
})

test.concurrent('shorthands', () => {
    expect(createCSSWithTheme().create('hidden:first')?.text).toBe('.hidden\\:first:first-child{display:none}')
    expect(createCSSWithTheme().create('hidden:last')?.text).toBe('.hidden\\:last:last-child{display:none}')
    expect(createCSSWithTheme().create('hidden:even')?.text).toBe('.hidden\\:even:nth-child(2n){display:none}')
    expect(createCSSWithTheme().create('hidden:odd')?.text).toBe('.hidden\\:odd:nth-child(odd){display:none}')
    expect(createCSSWithTheme().create('hidden:nth(2)')?.text).toBe('.hidden\\:nth\\(2\\):nth-child(2){display:none}')
    expect(createCSSWithTheme().create('hidden:first:focus')?.text).toBe('.hidden\\:first\\:focus:first-child:focus{display:none}')
    expect(createCSSWithTheme().create('uppercase::first-letter')?.text).toBe('.uppercase\\:\\:first-letter::first-letter{text-transform:uppercase}')
})

// test.concurrent('ambiguous', () => {
//     expect(createCSSWithTheme().create('text:left_*')?.text).toBe('.text\\:left_\\* *{text-align:left}')
// })

// test.concurrent('reactive-rules', () => {
//     expect(createCSSWithTheme().create(':checked+{hidden}')?.text).toBe(':checked+.\\:checked\\+\\{hidden\\}{display:none}')
// })

// test.concurrent('multiple', () => {
//     expect(createCSSWithTheme().create('bg:black>li:nth(2):not(:nth(4))')?.text).toBe('.bg\\:black\\>li\\:nth\\(2\\)\\:not\\(\\:nth\\(4\\)\\)>li:nth-child(2):not(:nth-child(4)){background-color:oklch(0% 0 none)}')
//     expect(createCSSWithTheme().create('bg:black::slider-thumb')?.text).toBe('.bg\\:black\\:\\:slider-thumb::-webkit-slider-thumb{background-color:oklch(0% 0 none)}.bg\\:black\\:\\:slider-thumb::-moz-range-thumb{background-color:oklch(0% 0 none)}')
//     expect(createCSSWithTheme().create('content:\'⦿\':after')?.text).toBe('.content\\:\\\'⦿\\\'\\:after:after{content:\'⦿\'}')
// })

// test.concurrent('after', () => {
//     expect(createCSSWithTheme().create('content:external:after')?.text).toBe('.content\\:external\\:after:after{content:external}')
// })
