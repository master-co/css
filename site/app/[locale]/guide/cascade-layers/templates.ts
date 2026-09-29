import overviewTemplate from './tests/overview/template.html' with { turbopackLoader: 'raw-loader', turbopackAs: '*.js' }
import baseStylesTemplate from './tests/adding-base-styles/template.html' with { turbopackLoader: 'raw-loader', turbopackAs: '*.js' }
import defaultStylesTemplate from './tests/adding-default-styles/template.html' with { turbopackLoader: 'raw-loader', turbopackAs: '*.js' }
import overridingDefaultsTemplate from './tests/overriding-default-styles/template.html' with { turbopackLoader: 'raw-loader', turbopackAs: '*.js' }

export { overviewTemplate, baseStylesTemplate, defaultStylesTemplate, overridingDefaultsTemplate }
