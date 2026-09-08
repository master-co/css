import { compileManifestSync } from '@master/css-compiler/node'
import { createEngineSync } from '@master/css/node'
import { validateCSS } from '@master/css-tooling/css'
import preset from '../utils/preset-manifest'

export function configuredExampleHTML(classes: string[], element: 'div' | 'button' = 'div', label = 'Example') {
  return `<${element}${element === 'button' ? ' type="button"' : ''} class="${classes.join(' ')}">${label}</${element}>`
}

/** Compile the complete configuration before validating any class that depends on it. */
export function configuredExampleCSS(source: string, classes: string[]) {
  const result = compileManifestSync(source, { baseManifest: preset })
  const errors = result.diagnostics.filter(diagnostic => diagnostic.severity === 'error')
  if (errors.length) throw new Error(`Invalid documentation configuration: ${JSON.stringify(errors)}`)
  const engine = createEngineSync({ manifest: result.manifest })
  try {
    for (const className of classes) {
      const inspection = engine.inspect(className)
      if (!inspection.valid || inspection.rules.some(rule => validateCSS(rule.text).length)) {
        throw new Error(`Invalid configured documentation class: ${className}`)
      }
    }
    engine.ensureClassRules(classes)
    return result.nativeCSS + engine.snapshot().text
  } finally { engine.dispose() }
}
