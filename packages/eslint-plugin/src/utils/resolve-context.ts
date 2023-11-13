import settings from '../settings'

export default function resolveContext(context) {
    const resolvedSettings = Object.assign(settings, context.settings?.['@master/css'])
    return {
        settings: resolvedSettings,
        options: context.options[0] || {}
    }
}