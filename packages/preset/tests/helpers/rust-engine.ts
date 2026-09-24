import { onTestFinished } from 'vitest'
import { createRenderBindingSessionSync } from '@master/css-binding/engine/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export function createTestCSS(manifest: MasterCSSManifest) {
  const session = createRenderBindingSessionSync({ manifest })
  onTestFinished(() => session.dispose())

  function ensureClassRules(classNames: readonly string[]) {
    session.ensureClassRules(classNames)
  }

  return {
    createRule(className: string) {
      ensureClassRules([className])
      const rules = session.snapshot().snapshot.rules
        .filter((rule) => rule.className === className)
      if (!rules.length) return
      return Object.freeze({
        ...rules[0],
        text: rules.map(({ text }) => text).join('')
      })
    },
    ensureClassRules(...classNames: string[]) {
      ensureClassRules(classNames)
      return this
    },
    get text() {
      return session.snapshot().snapshot.text
    },
    get utilitiesLayer() {
      const text = session.snapshot().snapshot.text
      const start = text.indexOf('@layer utilities{')
      return Object.freeze({ text: start < 0 ? '' : text.slice(start) })
    }
  }
}
