import { createPresetEngine } from './preset-css'

const engine = createPresetEngine()

export function generatePresetCSS(classNames: readonly string[]): string {
  try {
    engine.ensureClassRules(classNames)
    return engine.snapshot().text
  } finally {
    engine.deleteClassRules(classNames)
  }
}
