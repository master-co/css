import { expectOrderOfRules, testCSS } from './css'

test('inset', () => {
    testCSS('top:20', '.top\\:20{top:1.25rem}')
    testCSS('bottom:10', '.bottom\\:10{bottom:0.625rem}')
    testCSS('inset:16', '.inset\\:16{inset:1rem}')
    testCSS('left:30', '.left\\:30{left:1.875rem}')
    testCSS('right:max(0,calc(50%-725))', '.right\\:max\\(0\\,calc\\(50\\%-725\\)\\){right:max(0rem,calc(50% - 45.3125rem))}')
})

it('checks inset order', () => {
    expectOrderOfRules(
        ['top:0', 'left:0', 'inset:0', 'right:0', 'bottom:0'],
        ['inset:0', 'bottom:0', 'left:0', 'right:0', 'top:0']
    )
})