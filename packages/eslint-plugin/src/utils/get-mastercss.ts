import MasterCSS, { Config, config } from '@master/css'
import exploreConfig from 'explore-config'

let currentCSS: MasterCSS
let currentConfig: string | Config

export default function getMasterCSS(config: string | Config) {
    if (!currentCSS || currentConfig !== config) {
        currentCSS = new MasterCSS(typeof config === 'object' ? config : exploreConfig(config || ''))
        currentConfig = config
    }
    return currentCSS
}