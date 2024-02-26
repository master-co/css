import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import settings from '../settings'

export default function resolveContext(context: RuleContext<any, any[]>) {
    const resolvedSettings = Object.assign(settings, context.settings?.['@master/css'])
    return {
        settings: resolvedSettings,
        options: context.options[0] || {}
    }
}