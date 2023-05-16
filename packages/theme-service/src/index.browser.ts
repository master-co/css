import { ThemeService } from './core'
import { Options } from './options'

new ThemeService((window as any).themeServiceOptions)

declare global {
    interface Window {
        themeServiceOptions: Options
    }
}
