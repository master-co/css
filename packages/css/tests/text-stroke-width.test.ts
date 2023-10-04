import { testProp } from './css'

test('text-stroke-width', () => {
    testProp(['text-stroke:thin', 'text-stroke-width:thin'], '-webkit-text-stroke-width:thin')
})