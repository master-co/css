import config from './config'

test('selectors', () => {
    expect(new MasterCSS(config).create('hide>custom')?.text).toBe('.hide\\>custom>div>:first-child+button{display:none}')
    expect(new MasterCSS(config).create('hide_custom')?.text).toBe('.hide_custom::before,.hide_custom::after{display:none}')
    expect(new MasterCSS(config).create('hide~custom-1')?.text).toBe('.hide\\~custom-1~div{display:none}')
    expect(new MasterCSS(config).create('hide::slider-thumb')?.text).toBe('.hide\\:\\:slider-thumb::-webkit-slider-thumb{display:none}.hide\\:\\:slider-thumb::-moz-range-thumb{display:none}')
    expect(new MasterCSS().create('bg:red:hover_.feature__tab-title')?.text).toBe('.bg\\:red\\:hover_\\.feature__tab-title:hover .feature__tab-title{background-color:rgb(var(--red))}')
})

test('viewports', () => {
    expect(new MasterCSS().create('hide@xs')?.text).toBe('@media (min-width:768px){.hide\\@xs{display:none}}')
})

test('shorthands', () => {
    expect(new MasterCSS().create('hide:first')?.text).toBe('.hide\\:first:first-child{display:none}')
    expect(new MasterCSS().create('hide:last')?.text).toBe('.hide\\:last:last-child{display:none}')
    expect(new MasterCSS().create('hide:even')?.text).toBe('.hide\\:even:nth-child(2n){display:none}')
    expect(new MasterCSS().create('hide:odd')?.text).toBe('.hide\\:odd:nth-child(odd){display:none}')
    expect(new MasterCSS().create('hide:nth(2)')?.text).toBe('.hide\\:nth\\(2\\):nth-child(2){display:none}')
    expect(new MasterCSS().create('hide:first:focus')?.text).toBe('.hide\\:first\\:focus:first-child:focus{display:none}')
    expect(new MasterCSS().create('uppercase::first-letter')?.text).toBe('.uppercase\\:\\:first-letter::first-letter{text-transform:uppercase}')
})

test('reactive-rules', () => {
    expect(new MasterCSS().create(':checked+{hide}')?.text).toBe(':checked+.\\:checked\\+\\{hide\\}{display:none}')
})

test('multiple', () => {
    expect(new MasterCSS().create('bg:black>li:nth(2):not(:nth(4))')?.text).toBe('.bg\\:black\\>li\\:nth\\(2\\)\\:not\\(\\:nth\\(4\\)\\)>li:nth-child(2):not(:nth-child(4)){background-color:rgb(0 0 0)}')
    expect(new MasterCSS().create('bg:black::slider-thumb')?.text).toBe('.bg\\:black\\:\\:slider-thumb::-webkit-slider-thumb{background-color:rgb(0 0 0)}.bg\\:black\\:\\:slider-thumb::-moz-range-thumb{background-color:rgb(0 0 0)}')
    expect(new MasterCSS().create('content:\'⦿\':after,:before')?.text).toBe('.content\\:\\\'⦿\\\'\\:after\\,\\:before:after,.content\\:\\\'⦿\\\'\\:after\\,\\:before:before{content:\'⦿\'}')
})