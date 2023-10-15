import { testCSS } from '../../css'

test('variable', () => {
    testCSS('text-align:$(placement)', '.text-align\\:\\$\\(placement\\){text-align:center}', { variables: { placement: 'center' } })
})

it('falls back to native if not found', () => {
    testCSS('text-align:$(placement)', '.text-align\\:\\$\\(placement\\){text-align:var(--placement)}')
})