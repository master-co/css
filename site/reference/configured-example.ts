import { compileManifestSync } from '@master/css-compiler/node'
import { createRenderSessionSync } from '@master/css/node'
import { supportsNativeDeclaration } from '@master/css-tooling/node'
import { validateCSS } from '@master/css-tooling/css'
import preset from '../utils/preset-manifest'

/** Only site-authored literal HTML is accepted by the configured preview components. */
export function configuredMarkupClasses(html: string) {
  return [...new Set([...html.matchAll(/\bclass="([^"]*)"/g)].flatMap(match => match[1].split(/\s+/)).filter(Boolean))]
}

export function configuredMarkupMarkdown(source: string, html: string) {
  return `${source.trim() ? `\`\`\`css\n${source}\n\`\`\`\n\n` : ''}\`\`\`html\n${html}\n\`\`\`\n\n\`\`\`css\n${configuredExampleCSS(source, configuredMarkupClasses(html))}\n\`\`\``
}

export function configuredExampleHTML(classes: string[], element: 'div' | 'button' = 'div', label = 'Example') {
  return `<${element}${element === 'button' ? ' type="button"' : ''} class="${classes.join(' ')}">${label}</${element}>`
}

/** Compile the complete configuration before validating any class that depends on it. */
export function configuredExampleCSS(source: string, classes: string[]) {
  const result = compileManifestSync(source, { baseManifest: preset })
  const errors = result.diagnostics.filter(diagnostic => diagnostic.severity === 'error')
  if (errors.length) throw new Error(`Invalid documentation configuration: ${JSON.stringify(errors)}`)
  const engine = createRenderSessionSync({ manifest: result.manifest, supportsNativeDeclaration })
  try {
    const snapshot = engine.ensureClassRules(classes)
    for (const className of classes) {
      if (snapshot.invalidClassNames.includes(className) || snapshot.classRules[className].some(rule => validateCSS(rule.text).length)) {
        throw new Error(`Invalid configured documentation class: ${className}`)
      }
    }
    return result.nativeCSS + snapshot.cssText
  } finally { engine.dispose() }
}
