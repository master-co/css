import { initCSSRuntime } from '@master/css-runtime'
import config from 'virtual:master-css-config'
import localConfig from '../master.css?master-css-config'

initCSSRuntime(config)

console.log('Master CSS Webpack config:', config)
console.log('Master CSS per-file config:', localConfig)
