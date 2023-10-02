import type { Config } from '.'

const selectors: Config['selectors'] = {
    '::scrollbar': '::-webkit-scrollbar',
    '::scrollbar-button': '::-webkit-scrollbar-button',
    '::scrollbar-thumb': '::-webkit-scrollbar-thumb',
    '::scrollbar-track': '::-webkit-scrollbar-track',
    '::scrollbar-track-piece': '::-webkit-scrollbar-track-piece',
    '::scrollbar-corner': '::-webkit-scrollbar-corner',
    '::slider-thumb': ['::-webkit-slider-thumb', '::-moz-range-thumb'],
    '::slider-runnable-track': ['::-webkit-slider-runnable-track', '::-moz-range-track'],
    '::meter': '::-webkit-meter',
    '::resizer': '::-webkit-resizer',
    '::progress': '::-webkit-progress',
    ':first': ':first-child',
    ':last': ':last-child',
    ':even': ':nth-child(2n)',
    ':odd': ':nth-child(odd)',
    ':nth(': ':nth-child(',
    ':only': ':only-child'
}

export default selectors
