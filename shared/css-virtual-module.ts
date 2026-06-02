import path from 'node:path'
import { VIRTUAL_CONFIG_DIR } from './css-config-module.js'

export const VIRTUAL_CSS_ID = 'virtual:master-utilities.css'

export function toVirtualCSSModulePath(context: string) {
    return path.join(context, VIRTUAL_CONFIG_DIR, 'master-utilities.css')
}
