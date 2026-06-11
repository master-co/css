import { createCSS } from '@master/css'
import themeConfig from '@master/css/index.css?master-css-config'

const themeCSS = createCSS(themeConfig)

export const createThemeCSS = () => {
    return createCSS(themeConfig)
}

export default themeCSS
