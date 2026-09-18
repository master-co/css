// Audit-only static publisher experiment. This replaces internal plugin callbacks
// in a disposable build to test the existing compiler graph API; it is not a
// production implementation, public adapter contract, or host lifecycle fix.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { extname, posix } from 'node:path'

const hash = input => createHash('sha256').update(input).digest('hex').slice(0, 20)
export function installDeliveryExperiment(plugin, graphCompiler) {
  const delivery = {
    entryURL: './master-css-entry.css',
    stylesheetURL: (file, variant) => `./master-css-source-${hash(variant ?? file)}.css`,
    resourceURL: file => `./master-css-resource-${hash(readFileSync(file))}${extname(file)}`,
    relativeResourceURLs: true,
    resolveNodePackageImports: true
  }
  plugin.createExtractedCSSResult = async function (options = {}) {
    const result = await this.stylesheets.compose({ scanner: this.scanner,
      baseManifest: this.scanner.css.manifest, classes: this.getScannerClasses(),
      projectDir: this.cwd, ...options, delivery })
    this.emittedGlobals = result.emittedGlobals
    return result
  }
  const createContext = plugin.createContext.bind(plugin)
  plugin.createContext = function (compiler) {
    const context = createContext(compiler)
    context.createGeneratedCSSModule = async () => context.slotCSSRule
    compiler.hooks.thisCompilation.tap('AuditGraphDelivery', compilation => {
      compilation.hooks.processAssets.tapPromise({ name: 'AuditGraphDelivery',
        stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE + 1 }, async assets => {
        const extracted = await plugin.createExtractedCSSResult()
        for (const assetName of Object.keys(assets).filter(name => name.endsWith('.css'))) {
          const source = String(compilation.getAsset(assetName).source.source())
          const bundle = graphCompiler.prepareStylesheetBundle({ source, from: assetName,
            slotCSSRule: context.slotCSSRule,
            managed: { entry: 'managed', stylesheets: [
              { id: 'managed', href: delivery.entryURL, css: extracted.css },
              ...(extracted.stylesheets ?? [])
            ] } })
          if (!bundle.slots) continue
          const digest = hash(JSON.stringify(bundle))
          const urls = Object.fromEntries(bundle.graph.stylesheets.map((node, index) =>
            [node.id, `./master-css-${digest}-${index}.css`]))
          const rendered = graphCompiler.renderStylesheetBundle({ bundle, urls, preserveResourceBase: true })
          const folder = posix.dirname(assetName)
          for (const asset of rendered) {
            compilation.emitAsset(posix.join(folder, asset.href), new compiler.webpack.sources.RawSource(asset.css))
          }
          for (const resource of extracted.resources ?? []) {
            compilation.emitAsset(posix.join(folder, resource.href), new compiler.webpack.sources.RawSource(readFileSync(resource.file)))
            compilation.fileDependencies.add(resource.file)
          }
          compilation.updateAsset(assetName, new compiler.webpack.sources.RawSource(`@import "${urls[bundle.graph.entry]}";`))
        }
      })
    })
    return context
  }
  return plugin
}
