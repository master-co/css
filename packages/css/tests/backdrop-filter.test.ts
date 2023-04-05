import { testCSS } from './css'

test('backdrop-filter', () => {
    testCSS('bd:drop-shadow(0|2|8|slate-80)', '.bd\\:drop-shadow\\(0\\|2\\|8\\|slate-80\\){backdrop-filter:drop-shadow(0rem 0.125rem 0.5rem #d7dae3);-webkit-backdrop-filter:drop-shadow(0rem 0.125rem 0.5rem #d7dae3)}')
})
