import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('group', () => {
    expect(createCSS().create('{color:black!;bb:2|solid}')?.text).toBe('.\\{color\\:black\\!\\;bb\\:2\\|solid\\}{color:var(--color-black)!important;border-bottom:0.125rem solid}')
    expect(createCSS({ important: true }).create('{color:black!;bb:2|solid}')?.text).toBe('.\\{color\\:black\\!\\;bb\\:2\\|solid\\}{color:var(--color-black)!important;border-bottom:0.125rem solid!important}')
    expect(createCSS().create('{pt:calc(2.5em+60);mt:-60}_:where(h1,h2,h3,h4,h5,h6)')?.text).toBe('.\\{pt\\:calc\\(2\\.5em\\+60\\)\\;mt\\:-60\\}_\\:where\\(h1\\,h2\\,h3\\,h4\\,h5\\,h6\\) :where(h1,h2,h3,h4,h5,h6){padding-top:calc(2.5em + 3.75rem);margin-top:-3.75rem}')
    expect(createCSS().create('{line-height:calc(32-16);font-size:calc(32-16)}')?.text).toBe('.\\{line-height\\:calc\\(32-16\\)\\;font-size\\:calc\\(32-16\\)\\}{line-height:calc(32 - 16);font-size:calc(2rem - 1rem)}')
    expect(createCSS().create('{m:32;leading:1.5}')?.text).toBe('.\\{m\\:32\\;leading\\:1\\.5\\}{margin:2rem;line-height:1.5}')
    expect(createCSS({ variables: [{ namespace: 'G', key: '10', value: '#333333' }, { namespace: 'G', key: '20', value: '#666666' }, { namespace: 'G', key: '30', value: '#999999' }] })
        .create('{content:\'\';abs;inset:0;bg:linear-gradient(90deg,G-10/.1|10%,G-20/.2|20%,G-30/.3|60%,white/.4)}::after')?.text
    )
        .toBe('.\\{content\\:\\\'\\\'\\;abs\\;inset\\:0\\;bg\\:linear-gradient\\(90deg\\,G-10\\/\\.1\\|10\\%\\,G-20\\/\\.2\\|20\\%\\,G-30\\/\\.3\\|60\\%\\,white\\/\\.4\\)\\}\\:\\:after::after{content:\'\';position:absolute;inset:0rem;background-image:linear-gradient(90deg,color-mix(in oklab,var(--G-10) 10%,transparent) 10%,color-mix(in oklab,var(--G-20) 20%,transparent) 20%,color-mix(in oklab,var(--G-30) 30%,transparent) 60%,color-mix(in oklab,var(--color-white) 40%,transparent))}')
    expect(createCSS().create('{content:\'\';block}::after@light')?.text)
        .toBe('@media (prefers-color-scheme:light){.\\{content\\:\\\'\\\'\\;block\\}\\:\\:after\\@light::after{content:\'\';display:block}}')
})

it.concurrent('contains illegal syntax in group', () => {
    expect(createCSS().create('{form}')?.text).toBe('')
    expect(createCSS().create('{form;block}')?.text).toBe('.\\{form\\;block\\}{display:block}')
})
