import type { Config } from '@master/css'
import { MASTER_CSS_CONFIG_QUERY, RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX } from '../common'

export function stripMasterCSSConfigQuery(id: string) {
    return id.endsWith(MASTER_CSS_CONFIG_QUERY)
        ? id.slice(0, -MASTER_CSS_CONFIG_QUERY.length)
        : id
}

export function toResolvedMasterCSSConfigId(file: string) {
    return RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX + encodeURIComponent(file).replace(/\./g, '%2E')
}

export function fromResolvedMasterCSSConfigId(id: string) {
    return id.startsWith(RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX)
        ? decodeURIComponent(id.slice(RESOLVED_MASTER_CSS_CONFIG_QUERY_PREFIX.length))
        : undefined
}

export function toConfigModule(config: Config) {
    return `export default ${JSON.stringify(config)};`
}
