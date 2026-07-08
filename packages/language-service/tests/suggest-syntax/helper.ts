import CSSLanguageService from '../../src/core'
import createDoc from '../../src/utils/create-doc'
import { Settings } from '../../src/settings'
import { createPresetManifest } from '../helpers/create-preset-manifest'

const defaultPresetManifest = createPresetManifest()
const defaultLanguageService = new CSSLanguageService({ manifest: defaultPresetManifest })
const presetManifestByInput = new WeakMap<object, ReturnType<typeof createPresetManifest>>()
const languageServiceBySettings = new WeakMap<object, CSSLanguageService>()
const defaultHintCache = new Map<string, ReturnType<CSSLanguageService['suggestSyntax']>>()
const hintCacheBySettings = new WeakMap<object, Map<string, ReturnType<CSSLanguageService['suggestSyntax']>>>()

function getPresetManifest(manifest: Settings['manifest']) {
  if (!manifest) return defaultPresetManifest
  const cachedPlan = presetManifestByInput.get(manifest)
  if (cachedPlan) return cachedPlan
  const presetManifest = createPresetManifest(manifest)
  presetManifestByInput.set(manifest, presetManifest)
  return presetManifest
}

function getLanguageService(settings: Settings) {
  if (!Object.keys(settings).length) return defaultLanguageService
  const cachedLanguageService = languageServiceBySettings.get(settings)
  if (cachedLanguageService) return cachedLanguageService
  const languageService = new CSSLanguageService({
    ...settings,
    manifest: getPresetManifest(settings.manifest)
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
