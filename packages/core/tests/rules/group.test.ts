import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('group', () => {
    expect(createCSS().create('{color:black!;bb:2|solid}')?.text).toBe('.\\{color\\:black\\!\\;bb\\:2\\|solid\\}{color:oklch(0% 0 none)!important;border-bottom:0.125rem solid}')
    expect(createCSS({ important: true }).create('{color:black!;bb:2|solid}')?.text).toBe('.\\{color\\:black\\!\\;bb\\:2\\|solid\\}{color:oklch(0% 0 none)!important;border-bottom:0.125rem solid!important}')
    expect(createCSS().create('{pt:calc(2.5em+60);mt:-60}_:where(h1,h2,h3,h4,h5,h6)')?.text).toBe('.\\{pt\\:calc\\(2\\.5em\\+60\\)\\;mt\\:-60\\}_\\:where\\(h1\\,h2\\,h3\\,h4\\,h5\\,h6\\) :where(h1,h2,h3,h4,h5,h6){padding-top:calc(2.5em + 3.75rem);margin-top:-3.75rem}')
    expect(createCSS().create('{line-height:calc(32-16);font-size:calc(32-16)}')?.text).toBe('.\\{line-height\\:calc\\(32-16\\)\\;font-size\\:calc\\(32-16\\)\\}{line-height:calc(32 - 16);font-size:calc(2rem - 1rem)}')
    expect(createCSS().create('{m:32;leading:1.5}')?.text).toBe('.\\{m\\:32\\;leading\\:1\\.5\\}{margin:2rem;line-height:1.5}')
    expect(createCSS({
        variables: {
            G: {
                10: '#333333',
                20: '#666666',
                30: '#999999',
            }
        }
    })
        .create('{content:\'\';abs;inset:0;bg:linear-gradient(90deg,G-10/.1|10%,G-20/.2|20%,G-30/.3|60%,white/.4)}::after')?.text
    )
        .toBe('.\\{content\\:\\\'\\\'\\;abs\\;inset\\:0\\;bg\\:linear-gradient\\(90deg\\,G-10\\/\\.1\\|10\\%\\,G-20\\/\\.2\\|20\\%\\,G-30\\/\\.3\\|60\\%\\,white\\/\\.4\\)\\}\\:\\:after::after{content:\'\';position:absolute;inset:0rem;background-image:linear-gradient(90deg,rgb(51 51 51/0.1) 10%,rgb(102 102 102/0.2) 20%,rgb(153 153 153/0.3) 60%,oklch(100% 0 none/0.4))}')
})

it.concurrent('contains illegal syntax in group', () => {
    expect(createCSS().create('{form}')?.text).toBe('')
    expect(createCSS().create('{form;block}')?.text).toBe('.\\{form\\;block\\}{display:block}')
})