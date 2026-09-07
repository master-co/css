import { createEngineSync } from '@master/css/node'
import type { MasterCSSManifest, MasterCSSManifestUtilityLayerName } from '@master/css-schema/manifest'

export function createTestCSS(manifest: MasterCSSManifest) {
  const engine = createEngineSync({ manifest })
  const layer = (name: MasterCSSManifestUtilityLayerName) => ({
    get text() {
      return engine.snapshot().rules
        .filter((rule) => rule.layer === name)
        .map((rule) => rule.text)
        .join('')
    }
  })
  const resource = (kind: 'theme' | 'animations') => ({
    get text() {
      const resources = engine.snapshot().resources
      return kind === 'theme'
        ? resources.themeText || ''
        : resources.animations.map(({ text }) => text).join('')
    }
  })
  const api = {
    createRule(className: string) {
      const inspection = engine.inspect(className)
      const rules = inspection.rules.filter((rule) => rule.className === className)
      if (!inspection.valid || !rules.length) return
      return {
        text: rules.map((rule) => rule.text).join(''),
        type: rules[0].type,
        layerName: rules[0].layer
      }
    },
    ensureClassRules(...classNames: string[]) {
      engine.ensureClassRules(classNames)
      return api
    },
    deleteClassRules(...classNames: string[]) {
      engine.deleteClassRules(classNames)
      return api
    },
    get text() {
      return engine.snapshot().text
    },
    themeLayer: resource('theme'),
    defaultsLayer: layer('defaults'),
    componentsLayer: layer('components'),
    utilitiesLayer: layer('utilities'),
    animationsNonLayer: resource('animations'),
    dispose() {
      engine.dispose()
    }
  }
  return api
}
