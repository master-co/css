import { compileManifestSync } from '@master/css-compiler/node'
import { createRenderSessionSync } from '@master/css/node'
import { validateCSS } from '@master/css-tooling/css'
import preset from '../utils/preset-manifest'

/** Only site-authored literal HTML is accepted by the configured preview components. */
export function configuredMarkupClasses(html: string) {
  return [...new Set([...html.matchAll(/\bclass="([^"]*)"/g)].flatMap(match => match[1].split(/\s+/)).filter(Boolean))]
}

export function configuredMarkupMarkdown(source: string, html: string, css = configuredExampleCSS(source, configuredMarkupClasses(html))) {
  return `${source.trim() ? `\`\`\`css\n${source}\n\`\`\`\n\n` : ''}\`\`\`html\n${html}\n\`\`\`\n\n\`\`\`css disclosure=generated-css\n${css}\n\`\`\``
}

export function configuredExampleHTML(classes: string[], element: 'div' | 'button' = 'div', label = 'Example') {
  return `<${element}${element === 'button' ? ' type="button"' : ''} class="${classes.join(' ')}">${label}</${element}>`
}

// Pages and generated content repeat the same configurations; each compile costs tens of milliseconds.
const configurations = new Map<string, ReturnType<typeof compileManifestSync>>()
const examples = new Map<string, string>()

function compileConfiguration(source: string) {
  let result = configurations.get(source)
  if (result) return result
  result = compileManifestSync(source, { baseManifest: preset })
  const errors = result.diagnostics.filter(diagnostic => diagnostic.severity === 'error')
  if (errors.length) throw new Error(`Invalid documentation configuration: ${JSON.stringify(errors)}`)
  configurations.set(source, result)
  return result
}

/** Compile the complete configuration before validating any class that depends on it. */
export function configuredExampleCSS(source: string, classes: string[]) {
  const key = JSON.stringify([source, classes])
  const cached = examples.get(key)
  if (cached !== undefined) return cached
  const result = compileConfiguration(source)
  const engine = createRenderSessionSync({ manifest: result.manifest })
  try {
    engine.ensureStylesheetResources(result.css)
    const snapshot = engine.ensureClassRules(classes)
    for (const className of classes) {
      if (!result.nativeClassNames.includes(className) && (snapshot.invalidClassNames.includes(className) || snapshot.classRules[className].some(rule => validateCSS(rule.text).length))) {
        throw new Error(`Invalid configured documentation class: ${className}`)
      }
    }
    const css = (snapshot.engine.stylesheets ?? []).join('\n\n') + snapshot.cssText
    examples.set(key, css)
    return css
  } finally { engine.dispose() }
}
