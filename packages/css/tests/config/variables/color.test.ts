import { testProp } from '../../css'

test('with fallback color', () => {
    testProp('background-color:$(primary,white/.1)', 'background:var(rgb(0 0 0),rgb(255 255 255/.1))', {
        variables: { primary: '#000000' }
    })
})