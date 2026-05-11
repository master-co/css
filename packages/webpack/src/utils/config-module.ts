import type { Config } from '@master/css'
import path from 'node:path'
import { MASTER_CSS_CONFIG_QUERY, VIRTUAL_CONFIG_DIR } from '../common'

export function stripMasterCSSConfigQuery(id: string) {
    return id.endsWith(MASTER_CSS_CONFIG_QUERY)
        ? id.slice(0, -MASTER_CSS_CONFIG_QUERY.length)
        : id
}

function encodeVirtualFilename(id: string) {
    return encodeURIComponent(id).replace(/\./g, '%2E')
}

export function toVirtualDefaultConfigModulePath(context: string) {
    return path.join(context, VIRTUAL_CONFIG_DIR, 'master-css-config.js')
}

export function toVirtualCSSConfigModulePath(context: string, file: string) {
    return path.join(context, VIRTUAL_CONFIG_DIR, `${encodeVirtualFilename(file)}.js`)
}

export function toConfigModule(config: Config) {
    return `export default ${JSON.stringify(config)};`
}
