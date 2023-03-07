import { MasterCSS } from './css'

new MasterCSS(window['masterCSSConfig'])

declare global {
    interface Window {
        MasterCSS: typeof MasterCSS
    }
}
