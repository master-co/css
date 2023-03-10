import { MasterCSS } from './css'
import { Theme } from './theme'

new MasterCSS((window as any).masterCSSConfig)
new Theme((window as any).masterCSSThemeSettings)

declare global {
    interface Window {
        MasterCSS: typeof MasterCSS
    }
}
