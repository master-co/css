import { createCSS } from '@master/css'
import presetConfig from '@master/css/index.css?master-css-config'

const presetCSS = createCSS(presetConfig)

export const createPresetCSS = () => {
    return createCSS(presetConfig)
}

export default presetCSS
