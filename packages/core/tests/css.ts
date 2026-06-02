import createCSSWithTheme from './helpers/create-css-with-theme'

// share the same MasterCSS instance across all tests
const css = createCSSWithTheme()

export default css
