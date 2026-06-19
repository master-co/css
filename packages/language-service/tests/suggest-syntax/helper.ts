import CSSLanguageService from '../../src/core'
import createDoc from '../../src/utils/create-doc'
import { Settings } from '../../src/settings'
import { createPresetPlan } from '../helpers/create-preset-plan'

const defaultPresetPlan = createPresetPlan()
const defaultLanguageService = new CSSLanguageService({ plan: defaultPresetPlan })
const presetPlanByInput = new WeakMap<object, ReturnType<typeof createPresetPlan>>()
const languageServiceBySettings = new WeakMap<object, CSSLanguageService>()
const defaultHintCache = new Map<string, ReturnType<CSSLanguageService['suggestSyntax']>>()
const hintCacheBySettings = new WeakMap<object, Map<string, ReturnType<CSSLanguageService['suggestSyntax']>>>()

function getPresetPlan(plan: Settings['plan']) {
    if (!plan) return defaultPresetPlan
    const cachedPlan = presetPlanByInput.get(plan)
    if (cachedPlan) return cachedPlan
    const presetPlan = createPresetPlan(plan)
    presetPlanByInput.set(plan, presetPlan)
    return presetPlan
}

function getLanguageService(settings: Settings) {
    if (!Object.keys(settings).length) return defaultLanguageService
    const cachedLanguageService = languageServiceBySettings.get(settings)
    if (cachedLanguageService) return cachedLanguageService
    const languageService = new CSSLanguageService({
        ...settings,
        plan: getPresetPlan(settings.plan)
    })
    languageServiceBySettings.set(settings, languageService)
    return languageService
}

function getHintCache(settings: Settings) {
    if (!Object.keys(settings).length) return defaultHintCache
    let hintCache = hintCacheBySettings.get(settings)
    if (!hintCache) {
        hintCache = new Map()
        hintCacheBySettings.set(settings, hintCache)
    }
    return hintCache
}

export const hint = (target: string, settings: Settings = {}) => {
    const hintCache = getHintCache(settings)
    if (hintCache.has(target)) return hintCache.get(target)
    const contents = [`<div class="`, target, `"></div>`]
    const doc = createDoc('html', contents.join(''))
    const completionItems = getLanguageService(settings).suggestSyntax(doc, doc.positionAt(contents[0].length + target.length), {
        triggerKind: 2,
        triggerCharacter: target.charAt(target.length - 1)
    })
    hintCache.set(target, completionItems)
    return completionItems
}
