import { testCSS } from './css'

test('min-wh', () => {
    testCSS('min:16x10', '.min\\:16x10{min-width:1rem;min-height:0.625rem}')
    // testCSS('min:16xcalc(min(30,50)-25)', '.min\\:16xcalc\\(min\\(30\\,50\\)-25\\){min-width:1rem;min-height:calc(min(1.875rem, 3.125rem) - 1.5625rem)}')
    // testCSS('min:min(10,calc(25-10))x10', '.min\\:min\\(10\\,calc\\(25-10\\)\\)x10{min-width:min(0.625rem,calc(1.5625rem - 0.625rem));min-height:0.625rem}')
    // testCSS('min:min(10,calc(25-10))xcalc(min(30,50)-25)', '.min\\:min\\(10\\,calc\\(25-10\\)\\)xcalc\\(min\\(30\\,50\\)-25\\){min-width:min(0.625rem,calc(1.5625rem - 0.625rem));min-height:calc(min(1.875rem, 3.125rem) - 1.5625rem)}')
})
