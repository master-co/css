import path from 'node:path'
import { VIRTUAL_MODULE_DIR } from './plan-module'

export const VIRTUAL_CSS_ID = 'virtual:master-utilities.css'

export function toVirtualCSSModulePath(context: string) {
    return path.join(context, VIRTUAL_MODULE_DIR, 'master-utilities.css')
}
