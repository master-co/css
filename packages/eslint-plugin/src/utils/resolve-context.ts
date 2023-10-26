import settings from '../settings'
import exploreConfig from 'explore-config'

export default function resolveContext (context) {
    const resolvedSettings = Object.assign(settings, context.settings?.['@master/css'])
    const config = resolvedSettings?.config
    return {
        settings: resolvedSettings,
        options: context.options[0] || {},
        config: typeof config === 'object' ? config : exploreConfig(resolvedSettings?.config || '')
    }
}