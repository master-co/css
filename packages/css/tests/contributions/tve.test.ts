import { testCSS } from '../css'

describe('@tve', () => {
    it('scope', () => {
        testCSS(
            'pt:2ex',
            '.master-css .pt\\:2ex{padding-top:2ex}',
            { scope: '.master-css' }
        )

        testCSS(
            'pt:2ex@dark',
            '.dark .master-css .pt\\:2ex\\@dark{padding-top:2ex}',
            { scope: '.master-css' }
        )
    })
})
