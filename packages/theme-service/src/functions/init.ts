import { ThemeService } from '../core'
import { Options } from '../options'

export default function init(options?: Options, host?: HTMLElement) {
    return new ThemeService(options, host).init()
}