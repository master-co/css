import { createStylesheetCollection, type MasterCSSStylesheetDeliveryOptions } from '@master/css-compiler/stylesheet'
import type { MasterCSSVitePluginContext } from '../core'
import { getScanner } from './scanner-context'
import { getSassSourceFile, getPreparedSassSourceMap } from './build-sass-source'
import { getBuildStylesheetDelivery } from './build-stylesheet-delivery'
import { getDevStylesheetDelivery } from './dev-stylesheet-delivery'

export async function registerStylesheetSource(context: MasterCSSVitePluginContext, id: string, source: string, host?: Pick<MasterCSSStylesheetDeliveryOptions, 'resolveImport' | 'onDependency'>) {
  context.stylesheets ??= createStylesheetCollection()
  const scanner = getScanner(context)
  const delivery = getBuildStylesheetDelivery(context) ?? getDevStylesheetDelivery(context)
  return context.stylesheets.register(scanner, id, source, {
    baseManifest: scanner.css.manifest,
    projectDir: context.config?.root,
    delivery: delivery ? { ...delivery, ...host, baseFile: getSassSourceFile(id), sourceMap: await getPreparedSassSourceMap(context, id) } : undefined
  })
}
