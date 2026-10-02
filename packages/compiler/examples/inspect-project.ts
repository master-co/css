import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createEngineSync } from '@master/css/node'
import { loadProjectManifest } from '@master/css-compiler/project'
import { MasterCSSError } from '@master/css-schema'
import {
  flattenMasterCSSManifestVariables,
  serializeMasterCSSManifest,
  type MasterCSSManifest
} from '@master/css-schema/manifest'
import { validateClassNames } from '@master/css-tooling/validator'

export async function inspectProject(root: string, entry: string, classNames: readonly string[]) {
  try {
    const project = await loadProjectManifest({
      root,
      entries: [resolve(root, entry)],
      baseManifest: { version: 5, languageVersion: 14 }
    })
    const manifest = JSON.parse(serializeMasterCSSManifest(project.manifest)) as MasterCSSManifest
    using engine = createEngineSync({ manifest })
    const validation = await validateClassNames(classNames, { manifest })
    return {
      status: 'ready' as const,
      versions: { manifest: manifest.version, language: manifest.languageVersion },
      entries: project.entries,
      tokens: flattenMasterCSSManifestVariables(manifest.variables).map(token => token.name),
      diagnostics: project.diagnostics,
      classes: classNames.map((className, index) => ({
        className,
        inspection: engine.inspect(className),
        validation: validation.classes[index]
      }))
    }
  } catch (cause) {
    return {
      status: 'error' as const,
      error: cause instanceof MasterCSSError
        ? cause.toJSON()
        : { code: 'PROJECT_INSPECTION_FAILED', message: cause instanceof Error ? cause.message : String(cause) }
    }
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const [entry, ...classNames] = process.argv.slice(2)
  const report = entry
    ? await inspectProject(process.cwd(), entry, classNames)
    : { status: 'error' as const, error: { code: 'ENTRY_REQUIRED', message: 'Pass a project CSS entry before class names.' } }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  if (report.status === 'error') process.exitCode = 1
}
