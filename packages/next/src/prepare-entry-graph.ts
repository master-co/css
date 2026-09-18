import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { inspectCSS } from '@master/css-compiler'
import { compileRenderedStylesheet, compileStylesheet } from '@master/css-compiler/stylesheet'
import { defaultBuildManifest } from '@master/css-internal/project'
import { createNextModuleGraph } from './prepare-module-graph'
import { createNextPostCSS } from './prepare-postcss'
import { rebasePostCSSResources } from './postcss-resource-policy'
import { nextGeneratedGlobalAnimations } from './prepare-global-module'
import type { ModuleContext } from './prepare-module'
import type { NextStylesheetLoaderOptions } from './prepare-stylesheet'

export async function prepareNextEntryGraph(context: ModuleContext, projectDir: string, options: NextStylesheetLoaderOptions,
  onDependency: (file: string) => void, source: string, sourceMap?: string) {
  const postcss = options.preprocessed ? createNextPostCSS(context, projectDir, onDependency) : undefined
  const raw = createNextModuleGraph(context, projectDir, options, onDependency, { raw: true })
  const rawEntry = await raw.prepareEntry(source, sourceMap)
  const track = (file: string) => onDependency(raw.dependencyFile(file))
  const loadSass = () => ({ async compileStringAsync(css: string) { return { css } } })
  const resourceFiles = new Map<string, string>()
  const manifest = await compileRenderedStylesheet(context.resourcePath, rawEntry.source, {
    baseManifest: defaultBuildManifest, projectDir, preserveNativeCSS: true, loadSass,
    sourceMap: rawEntry.sourceMap, baseFile: context.resourcePath, onDependency: track,
    delivery: {
      entryURL: './entry.css',
      stylesheetURL: id => './' + createHash('sha256').update(id).digest('hex') + '.css',
      resourceURL: file => { const url = pathToFileURL(file).href;resourceFiles.set(url, file);return url },
      resolveImport: raw.resolveImport, onDependency: track
    }
  })
  if (!postcss) {
    // Without a host PostCSS pass the Module processors still scope animation
    // names. Keyframes Master generated for the graph must keep their names so
    // the rendered entry still emits them and Turbopack does not export them.
    // (`emittedGlobals` is processed history and also lists authored keyframes,
    // which stay Module-scoped exactly as in plain CSS Modules.)
    const globalAnimations = nextGeneratedGlobalAnimations(manifest.generatedCSS)
    const graph = createNextModuleGraph(context, projectDir, options, onDependency, {
      inputs: raw.inputs, retainedImports: raw.retainedImports,
      async transform(_file, input, inputMap) { return { source: input, sourceMap: inputMap, globalAnimations } }
    })
    return { graph, entry: await graph.prepareEntry(rawEntry.source, rawEntry.sourceMap), manifest: defaultBuildManifest, postcss: false }
  }
  const generatedCSS = rebasePostCSSResources(manifest.generatedCSS, context.resourcePath, [...resourceFiles])
  let processedGlobals = manifest.emittedGlobals
  let globalAnimations: string[] = []
  const graph = createNextModuleGraph(context, projectDir, options, onDependency, {
    inputs: raw.inputs, retainedImports: raw.retainedImports,
    async transform(file, input, inputMap, resource, scoped) {
      const inspection = await inspectCSS(input)
      // Ordinary CSS belongs to Next's pipeline. Lowering it here would optimize
      // away inputs (such as empty rules) before the user's PostCSS plugins run.
      const lowered = inspection.hasMasterEntry || inspection.directives.length
        ? await compileStylesheet(file, input, {
          baseManifest: manifest.manifest, projectDir, preserveNativeCSS: true, preserveNativeSource: true,
          loadSass, sourceMap: inputMap, baseFile: file, onDependency
        })
        : { css: input, sourceMap: inputMap }
      const result = await postcss(file, lowered.css, lowered.sourceMap, resource, file === context.resourcePath ? generatedCSS : '', scoped, globalAnimations, {
        file, projectDir, manifest: manifest.manifest, processedGlobals, resourceFiles: [...resourceFiles]
      })
      if (file === context.resourcePath) {
        globalAnimations = result.globalAnimations
        if ('processedGlobals' in result) processedGlobals = result.processedGlobals ?? processedGlobals
      }
      return result
    }
  })
  // The graph is now lowered and host-processed, including its generated globals.
  // The publication pass only reconnects imports/resources; it must not re-emit
  // the original manifest's unprocessed variables and keyframes afterward.
  return { graph, entry: await graph.prepareEntry(rawEntry.source, rawEntry.sourceMap), manifest: { version: 1 as const, utilities: [] }, postcss: true }
}
