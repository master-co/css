import { testCSS } from './css'

test('wh', () => {
    testCSS('16x10', '.\\31 6x10{width:1rem;height:0.625rem}')
    testCSS('16xcalc(min(30,50)-25)', '.\\31 6xcalc\\(min\\(30\\,50\\)-25\\){width:1rem;height:calc(min(1.875rem, 3.125rem) - 1.5625rem)}')
    testCSS('min(10,calc(25-10))x10', '.min\\(10\\,calc\\(25-10\\)\\)x10{width:min(0.625rem,calc(1.5625rem - 0.625rem));height:0.625rem}')
    testCSS('min(10,calc(25-10))xcalc(min(30,50)-25)', '.min\\(10\\,calc\\(25-10\\)\\)xcalc\\(min\\(30\\,50\\)-25\\){width:min(0.625rem,calc(1.5625rem - 0.625rem));height:calc(min(1.875rem, 3.125rem) - 1.5625rem)}')
})
