import config from './config'

test('selectors', () => {
    expect(new MasterCSS(config).create('hidden>custom')?.text).toBe('.hidden\\>custom>div>:first-child+button{display:none}')
    expect(new MasterCSS(config).create('hidden_custom')?.text).toBe('.hidden_custom::before,.hidden_custom::after{display:none}')
    expect(new MasterCSS(config).create('hidden~custom-1')?.text).toBe('.hidden\\~custom-1~div{display:none}')
    expect(new MasterCSS(config).create('hidden::slider-thumb')?.text).toBe('.hidden\\:\\:slider-thumb::-webkit-slider-thumb{display:none}.hidden\\:\\:slider-thumb::-moz-range-thumb{display:none}')
    expect(new MasterCSS().create('bg:red:hover_.feature__tab-title')?.text).toBe('.bg\\:red\\:hover_\\.feature__tab-title:hover .feature__tab-title{background-color:rgb(var(--red))}')
})

test('viewports', () => {
    expect(new MasterCSS().create('hidden@xs')?.text).toBe('@media (min-width:768px){.hidden\\@xs{display:none}}')
})

test('shorthands', () => {
    expect(new MasterCSS().create('hidden:first')?.text).toBe('.hidden\\:first:first-child{display:none}')
    expect(new MasterCSS().create('hidden:last')?.text).toBe('.hidden\\:last:last-child{display:none}')
    expect(new MasterCSS().create('hidden:even')?.text).toBe('.hidden\\:even:nth-child(2n){display:none}')
    expect(new MasterCSS().create('hidden:odd')?.text).toBe('.hidden\\:odd:nth-child(odd){display:none}')
    expect(new MasterCSS().create('hidden:nth(2)')?.text).toBe('.hidden\\:nth\\(2\\):nth-child(2){display:none}')
    expect(new MasterCSS().create('hidden:first:focus')?.text).toBe('.hidden\\:first\\:focus:first-child:focus{display:none}')
    expect(new MasterCSS().create('uppercase::first-letter')?.text).toBe('.uppercase\\:\\:first-letter::first-letter{text-transform:uppercase}')
})

test('reactive-rules', () => {
    expect(new MasterCSS().create(':checked+{hidden}')?.text).toBe(':checked+.\\:checked\\+\\{hidden\\}{display:none}')
})

test('multiple', () => {
    expect(new MasterCSS().create('bg:black>li:nth(2):not(:nth(4))')?.text).toBe('.bg\\:black\\>li\\:nth\\(2\\)\\:not\\(\\:nth\\(4\\)\\)>li:nth-child(2):not(:nth-child(4)){background-color:rgb(0 0 0)}')
    expect(new MasterCSS().create('bg:black::slider-thumb')?.text).toBe('.bg\\:black\\:\\:slider-thumb::-webkit-slider-thumb{background-color:rgb(0 0 0)}.bg\\:black\\:\\:slider-thumb::-moz-range-thumb{background-color:rgb(0 0 0)}')
    expect(new MasterCSS().create('content:\'⦿\':after,:before')?.text).toBe('.content\\:\\\'⦿\\\'\\:after\\,\\:before:after,.content\\:\\\'⦿\\\'\\:after\\,\\:before:before{content:\'⦿\'}')
})