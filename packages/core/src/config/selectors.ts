import { SelectorDefinitions } from '../types/config'

const selectors = {
    ':first': ':first-child',
    ':last': ':last-child',
    ':nth-last': ':nth-last-child',
    ':even': ':nth-child(2n)',
    ':odd': ':nth-child(odd)',
    ':nth': ':nth-child',
    ':only': ':only-child',
    ':rtl': ':dir(rtl)',
    ':ltr': ':dir(ltr)',
    '::scrollbar': '::-webkit-scrollbar',
    '::scrollbar-button': '::-webkit-scrollbar-button',
    '::scrollbar-thumb': '::-webkit-scrollbar-thumb',
    '::scrollbar-track': '::-webkit-scrollbar-track',
    '::scrollbar-track-piece': '::-webkit-scrollbar-track-piece',
    '::scrollbar-corner': '::-webkit-scrollbar-corner',
    '::slider-thumb': '::-webkit-slider-thumb',
    '::slider-runnable-track': '::-webkit-slider-runnable-track',
    '::resizer': '::-webkit-resizer',
    '::progress': '::-webkit-progress',
    // View Transitions API short aliases (#265 Layer 2)
    '::vt': '::view-transition',
    '::vt-group': '::view-transition-group',
    '::vt-image-pair': '::view-transition-image-pair',
    '::vt-old': '::view-transition-old',
    '::vt-new': '::view-transition-new',
} satisfies SelectorDefinitions

export default selectors
