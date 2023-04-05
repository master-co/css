import { testCSS } from './css'

test('max-width', () => {
    testCSS('max-w:3xs', '.max-w\\:3xs{max-width:22.5rem}')
    testCSS('max-w:md', '.max-w\\:md{max-width:64rem}')
    testCSS('max-w:16', '.max-w\\:16{max-width:1rem}')
    testCSS('max-w:16px', '.max-w\\:16px{max-width:16px}')
})