import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import settings, { Settings } from '../settings'
import exploreConfigSync from '@master/css-explore-config/sync'
import { Config, MasterCSS, createCSS } from '@master/css'

declare interface CSSCache {
    cwd: string
    settings: Settings,
    css: MasterCSS,
}

const cssCaches: CSSCache[] = []

export default function resolveContext(context: RuleContext<any, any[]>) {
    const resolvedSettings = Object.assign({}, settings, context.settings?.['@master/css'])
    let css = cssCaches.find(cache => cache.settings.config === resolvedSettings.config &&
        cache.cwd === context.cwd)?.css

    if (!css) {
        let config: Config | undefined
        if (typeof resolvedSettings.config === 'object') {
            config = resolvedSettings.config
        } else {
            config = exploreConfigSync({
                name: resolvedSettings.config,
                cwd: context.cwd,
                found(_, configPath) {
                    if (process.env.DEBUG) {
                        console.log('Found config:', configPath)
                    }
                },
            })?.config
        }
        css = createCSS(config)
        cssCaches.push({ cwd: context.cwd, settings: resolvedSettings, css })
    }

    return {
        settings: resolvedSettings,
        options: context.options[0] || {},
        css
    }
}
