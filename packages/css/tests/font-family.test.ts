import { testCSS } from './css'

test('font-family', () => {
    testCSS('font:serif', '.font\\:serif{font-family:ui-serif,Georgia,Cambria,Times New Roman,Times,serif}')
    testCSS('font:mono_:where(code,kbd,samp)', '.font\\:mono_\\:where\\(code\\,kbd\\,samp\\) :where(code,kbd,samp){font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace}')
    testCSS('font:serif:hover', '.font\\:serif\\:hover:hover{font-family:ui-serif,Georgia,Cambria,Times New Roman,Times,serif}')
})