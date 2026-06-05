import { createCSS } from '@master/css'
import themeConfig from '@master/css/theme.css?master-css-config'

const themeCSS = createCSS(themeConfig)

export const createThemeCSS = () => {
    return createCSS(themeConfig)
}

export default themeCSS
