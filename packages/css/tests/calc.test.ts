import { testProp } from './css'

it('calc', () => {
    testProp('w:calc(var(--h)|/|var(--w)*100%)', 'width:calc(var(--h) / var(--w) * 100% / 16 * 1rem)')
    testProp('w:calc($(h)/$(w)*100%)', 'width:calc(var(--h) / var(--w) * 100% / 16 * 1rem)')
    testProp('w:calc(var(--h)/var(--w)*100%)', 'width:calc(var(--h) / var(--w) * 100% / 16 * 1rem)')
    testProp('w:calc(var(--h)/var(--w)*100%)', 'width:calc(var(--h) / var(--w) * 100% / 16 * 1rem)')
    testProp('w:calc(var(--h)|/|var(--w)*100%)', 'width:calc(var(--h) / var(--w) * 100% / 16 * 1rem)')
    testProp('w:calc(var(--h)|/|var(--w)*100%)', 'width:calc(var(--h) / var(--w) * 100% / 16 * 1rem)')
    testProp('w:calc(1*2/3*100%)', 'width:calc(1 * 2 / 3 * 100% / 16 * 1rem)')
    testProp('w:calc(1rem*2/3*100%)', 'width:calc(1rem * 2 / 3 * 100%)')
    testProp('w:calc(1*2rem/3*100%)', 'width:calc(1 * 2rem / 3 * 100%)')
    testProp('w:calc(1*2/3*100em)', 'width:calc(1 * 2 / 3 * 100em)')
    testProp('w:calc(1*2/3*calc(2*3*6))', 'width:calc(1 * 2 / 3 * calc(2 * 3 * 6) / 16 * 1rem)')
    testProp('w:calc(5*(2*3rem+6)/3)', 'width:calc(5 * (2 * 3rem + 0.375rem) / 3)')
    testProp('w:calc((2*3rem+6)/5*2)', 'width:calc((2 * 3rem + 0.375rem) / 5 * 2)')
    testProp('w:calc((2*3+6)/5*2)', 'width:calc((2 * 3 + 6) / 5 * 2 / 16 * 1rem)')
    testProp('w:calc((2*3+6)+5*2)', 'width:calc((2 * 3 + 6) / 16 * 1rem + 5 * 2 / 16 * 1rem)')
    testProp('w:calc((6+2*(3+5rem*min(3,5)))/5*2)', 'width:calc((0.375rem + 2 * (0.1875rem + 5rem * min(3, 5))) / 5 * 2)')
    testProp('w:calc((6+2*(3+5*min(3,5)))/5*2)', 'width:calc((6 + 2 * (3 + 5 * min(3, 5))) / 5 * 2 / 16 * 1rem)')
    testProp('w:calc((6+2*(3+5*min(3rem,5)))/5*2)', 'width:calc((0.375rem + 2 * (0.1875rem + 5 * min(3rem, 0.3125rem))) / 5 * 2)')
    testProp('w:calc((6+3+min(3rem,5))', 'width:calc((0.375rem + 0.1875rem + min(3rem, 0.3125rem)))')
    testProp('lh:calc((6+3+min(3,5))', 'line-height:calc((6 + 3 + min(3, 5)))')
})