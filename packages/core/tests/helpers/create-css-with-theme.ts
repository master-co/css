import type { Config } from '../../src'
import { createCSS } from '../../src'
import { extendConfig } from '../../src/utils'
import themeConfig from '../../theme.css?master-css-config'

export function createThemeConfig(config?: Config) {
    return extendConfig(themeConfig, config)
}

export default function createCSSWithTheme(config?: Config) {
    return createCSS(createThemeConfig(config))
}

export { themeConfig }
