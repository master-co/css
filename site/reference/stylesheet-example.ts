import { compileManifestSync } from '@master/css-compiler/node'
import { createRenderSessionSync } from '@master/css/node'
import { beautifyCSS } from 'internal/utils/beautify-css'
import preset from '../utils/preset-manifest'

/** Compile trusted, standalone documentation CSS through the public rendering API. */
export async function stylesheetExampleCSS(source: string) {
  const result = compileManifestSync(source, {
    baseManifest: preset,
    preserveNativeCSS: true,
  })
  const errors = result.diagnostics.filter(diagnostic => diagnostic.severity === 'error')
  if (errors.length) throw new Error(`Invalid documentation stylesheet: ${JSON.stringify(errors)}`)
  const renderer = createRenderSessionSync({ manifest: result.manifest })
  try {
    renderer.ensureClassRules([])
    renderer.ensureStylesheetResources(result.css)
    return beautifyCSS([result.css, renderer.snapshot().cssText].filter(Boolean).join('\n\n')).trim()
  } finally { renderer.dispose() }
}

export async function stylesheetExampleMarkdown(title: string, source: string) {
  return `**${title}**\n\n\`\`\`css name=Source stylesheet=source\n${source}\n\`\`\`\n\n\`\`\`css name=Result stylesheet=result\n${await stylesheetExampleCSS(source)}\n\`\`\``
}
