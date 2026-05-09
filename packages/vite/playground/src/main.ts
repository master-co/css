import type { Config } from '@master/css'
import masterCSSConfig from 'virtual:master-css-config'
import localMasterCSSConfig from '../master.css?master-css-config'
import './styles.css'

const configs: Config[] = [masterCSSConfig, localMasterCSSConfig]

console.log('Master CSS Vite playground ready', configs.length)
