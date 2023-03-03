import { testCSS } from './test-css'

test('group', () => {
    testCSS('{color:indigo!;bb:2|solid}', '.\\{color\\:indigo\\!\\;bb\\:2\\|solid\\}{color:#5a5bd5!important;border-bottom:0.125rem solid}')
    testCSS('.content\\:\\\'abc\\\\\\\'_bdc\\\\\\\'\\\'_{fg:#fff}[data-title=\'abc_def\']', '.content\\:\\\'abc\\\\\\\'_bdc\\\\\\\'\\\' .\\.content\\\\\\:\\\\\\\'abc\\\\\\\\\\\\\\\'_bdc\\\\\\\\\\\\\\\'\\\\\\\'_\\{fg\\:\\#fff\\}\\[data-title\\=\\\'abc_def\\\'\\][data-title=\'abc_def\']{color:#fff}')
    testCSS('{color:indigo!;bb:2|solid}', '.\\{color\\:indigo\\!\\;bb\\:2\\|solid\\}{color:#5a5bd5!important;border-bottom:0.125rem solid!important}', { important: true })
    testCSS('{pt:calc(2.5em+60);mt:-60}_:where(h1,h2,h3,h4,h5,h6)', '.\\{pt\\:calc\\(2\\.5em\\+60\\)\\;mt\\:-60\\}_\\:where\\(h1\\,h2\\,h3\\,h4\\,h5\\,h6\\) :where(h1,h2,h3,h4,h5,h6){padding-top:calc(2.5em + 3.75rem);margin-top:-3.75rem}')
})
