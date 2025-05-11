import { it, test, expect } from 'vitest'
import { createCSS } from '../src'
import config from './config'

test.concurrent('hidden:hover', ({ task }) => {
    expect(createCSS(config).create(task.name)?.text).toBe('.hidden\\:hover:hover{display:none}')
})

test.concurrent('selectors', () => {
    expect(createCSS(config).create('hidden>custom')?.text).toBe('.hidden\\>custom>div>:first-child+button{display:none}')
    expect(createCSS(config).create('hidden~custom-1')?.text).toBe('.hidden\\~custom-1~div{display:none}')
    expect(createCSS(config).create('hidden::slider-thumb')?.text).toBe('.hidden\\:\\:slider-thumb::-webkit-slider-thumb{display:none}')
    expect(createCSS().create('bg:#000:hover_.feature__tab-title')?.text).toBe('.bg\\:\\#000\\:hover_\\.feature__tab-title:hover .feature__tab-title{background-color:#000}')
})

test.concurrent('shorthands', () => {
    expect(createCSS().create('hidden:first')?.text).toBe('.hidden\\:first:first-child{display:none}')
    expect(createCSS().create('hidden:last')?.text).toBe('.hidden\\:last:last-child{display:none}')
    expect(createCSS().create('hidden:even')?.text).toBe('.hidden\\:even:nth-child(2n){display:none}')
    expect(createCSS().create('hidden:odd')?.text).toBe('.hidden\\:odd:nth-child(odd){display:none}')
    expect(createCSS().create('hidden:nth(2)')?.text).toBe('.hidden\\:nth\\(2\\):nth-child(2){display:none}')
    expect(createCSS().create('hidden:first:focus')?.text).toBe('.hidden\\:first\\:focus:first-child:focus{display:none}')
    expect(createCSS().create('uppercase::first-letter')?.text).toBe('.uppercase\\:\\:first-letter::first-letter{text-transform:uppercase}')
})

// test.concurrent('ambiguous', () => {
//     expect(createCSS().create('text:left_*')?.text).toBe('.text\\:left_\\* *{text-align:left}')
// })

// test.concurrent('reactive-rules', () => {
//     expect(createCSS().create(':checked+{hidden}')?.text).toBe(':checked+.\\:checked\\+\\{hidden\\}{display:none}')
// })

// test.concurrent('multiple', () => {
//     expect(createCSS().create('bg:black>li:nth(2):not(:nth(4))')?.text).toBe('.bg\\:black\\>li\\:nth\\(2\\)\\:not\\(\\:nth\\(4\\)\\)>li:nth-child(2):not(:nth-child(4)){background-color:oklch(0% 0 none)}')
//     expect(createCSS().create('bg:black::slider-thumb')?.text).toBe('.bg\\:black\\:\\:slider-thumb::-webkit-slider-thumb{background-color:oklch(0% 0 none)}.bg\\:black\\:\\:slider-thumb::-moz-range-thumb{background-color:oklch(0% 0 none)}')
//     expect(createCSS().create('content:\'⦿\':after')?.text).toBe('.content\\:\\\'⦿\\\'\\:after:after{content:\'⦿\'}')
// })

// test.concurrent('after', () => {
//     expect(createCSS().create('content:external:after')?.text).toBe('.content\\:external\\:after:after{content:external}')
// })