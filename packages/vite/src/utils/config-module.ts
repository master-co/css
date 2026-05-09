import type { Config } from '@master/css'
import { MASTER_CSS_CONFIG_QUERY, RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX } from '../common'

export function stripMasterCSSConfigQuery(id: string) {
    return id.endsWith(MASTER_CSS_CONFIG_QUERY)
        ? id.slice(0, -MASTER_CSS_CONFIG_QUERY.length)
        : id
}

export function toResolvedMasterCSSConfigId(file: string) {
    return RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX + Buffer.from(file).toString('base64url')
}

export function fromResolvedMasterCSSConfigId(id: string) {
    return id.startsWith(RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX)
        ? Buffer.from(id.slice(RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX.length), 'base64url').toString()
        : undefined
}

export function toConfigModule(config: Config) {
    return `export default ${JSON.stringify(config)};`
}
