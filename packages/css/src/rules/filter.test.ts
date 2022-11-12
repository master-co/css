import { testCSS } from '../utils/test-css'

test('filter', () => {
    testCSS('drop-shadow(0|2|8|slate-80)', '.drop-shadow\\(0\\|2\\|8\\|slate-80\\){filter:drop-shadow(0rem 0.125rem 0.5rem #d7dae3)}')
})
