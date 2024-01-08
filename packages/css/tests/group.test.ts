test('group', () => {
    expect(new MasterCSS().create('{color:black!;bb:2|solid}')?.text).toBe('.\\{color\\:black\\!\\;bb\\:2\\|solid\\}{color:rgb(0 0 0)!important;border-bottom:0.125rem solid}')
    expect(new MasterCSS().create('.content\\:\\\'abc\\\\\\\'_bdc\\\\\\\'\\\'_{fg:#fff}[data-title=\'abc_def\']')?.text).toBe('.content\\:\\\'abc\\\\\\\'_bdc\\\\\\\'\\\' .\\.content\\\\\\:\\\\\\\'abc\\\\\\\\\\\\\\\'_bdc\\\\\\\\\\\\\\\'\\\\\\\'_\\{fg\\:\\#fff\\}\\[data-title\\=\\\'abc_def\\\'\\][data-title=\'abc_def\']{color:#fff}')
    expect(new MasterCSS({ important: true }).create('{color:black!;bb:2|solid}')?.text).toBe('.\\{color\\:black\\!\\;bb\\:2\\|solid\\}{color:rgb(0 0 0)!important;border-bottom:0.125rem solid!important}')
    expect(new MasterCSS().create('{pt:calc(2.5em+60);mt:-60}_:where(h1,h2,h3,h4,h5,h6)')?.text).toBe('.\\{pt\\:calc\\(2\\.5em\\+60\\)\\;mt\\:-60\\}_\\:where\\(h1\\,h2\\,h3\\,h4\\,h5\\,h6\\) :where(h1,h2,h3,h4,h5,h6){padding-top:calc(2.5em + 3.75rem);margin-top:-3.75rem}')
    expect(new MasterCSS().create('{line-height:calc(32-16);font-size:calc(32-16)}')?.text).toBe('.\\{line-height\\:calc\\(32-16\\)\\;font-size\\:calc\\(32-16\\)\\}{line-height:calc(32 - 16);font-size:calc(2rem - 1rem)}')
    expect(new MasterCSS().create('{m:32;lh:1.5}')?.text).toBe('.\\{m\\:32\\;lh\\:1\\.5\\}{margin:2rem;line-height:1.5}')
    expect(new MasterCSS({
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
        .toBe('.\\{content\\:\\\'\\\'\\;abs\\;inset\\:0\\;bg\\:linear-gradient\\(90deg\\,G-10\\/\\.1\\|10\\%\\,G-20\\/\\.2\\|20\\%\\,G-30\\/\\.3\\|60\\%\\,white\\/\\.4\\)\\}\\:\\:after::after{content:\'\';position:absolute;inset:0rem;background-image:linear-gradient(90deg,rgb(51 51 51/.1) 10%,rgb(102 102 102/.2) 20%,rgb(153 153 153/.3) 60%,rgb(255 255 255/.4))}')
})

it('contains illegal syntax in group', () => {
    expect(new MasterCSS().create('{form}')?.text).toBe('')
    expect(new MasterCSS().create('{form;block}')?.text).toBe('.\\{form\\;block\\}{display:block}')
})