import _exploreConfig, { ExploreConfigOptions } from 'explore-config'
import log from '@techor/log'
import type { Config } from '@master/css'

export default function exploreConfig(options?: ExploreConfigOptions & { name?: string }) {
    return _exploreConfig(options?.name || 'master.css', {
        found: (basename) => process.env.NODE_ENV !== 'test' && log.i`Loaded **${basename}**`,
        ...options
    }) as Config | undefined
}