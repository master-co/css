import _exploreConfig, { ExploreConfigOptions } from 'explore-config'
import type { Config } from '@master/css'

export default function exploreConfig(options?: ExploreConfigOptions & { name?: string }) {
    return _exploreConfig(options?.name || 'master.css', {
        found: (basename) => process.env.DEBUG && console.log(`[Master CSS] Loaded ${basename}`),
        ...options
    }) as Config | undefined
}