import defaultConfig from '@master/css/config'
import { extendConfig } from '@master/css/utils'
import type { Config } from 'shared/css-config'

export function resolveRuntimeConfig(config?: Config) {
    return extendConfig(defaultConfig, config)
}
