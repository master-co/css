import { Config } from './config'
import { MasterCSS } from './core'

new MasterCSS((window as any).masterCSSConfig)

declare global {
    interface Window {
        masterCSSConfig: Config
    }
}
