import { withStylesheetDependencies } from '../utils/failed-stylesheet-dependencies'
import { withSassDiagnostics } from '../utils/sass-diagnostics'
import type { Plugin } from 'vite'
import { VIRTUAL_CSS_ID } from '@master/css-internal/style-module'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'
import getExtractedCSS from '../utils/extracted-css'
import {
  collectStylesheetDependenciesSync
} from '@master/css-compiler/node'
import { resolveStylesheet, type MasterCSSStylesheetResolution } from '@master/css-compiler/stylesheet'
import { registerStylesheetSource } from '../utils/register-style-source'
import { getScanner } from '../utils/scanner-context'
import { isInlineStylesheet, registerInlineStylesheet } from '../utils/inline-stylesheet'
import { getBuildImportResolver } from '../utils/build-import-resolver'

import { getSassSourceFile, isRawStyleRequest } from '../utils/build-sass-source'

const RESOLVED_VIRTUAL_CSS_ID = '\0' + VIRTUAL_CSS_ID

export default function StyleEntryPlugin(_options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  return {
    name: 'master-css:style-entry',
    enforce: 'pre',
    resolveId(id) {
      if (id === VIRTUAL_CSS_ID || id === RESOLVED_VIRTUAL_CSS_ID) {
        return RESOLVED_VIRTUAL_CSS_ID
      }
    },
    async load(id) {
      if (id !== RESOLVED_VIRTUAL_CSS_ID) return

      context.virtualCSSImporters ??= new Set()
      context.virtualCSSImporters.add(RESOLVED_VIRTUAL_CSS_ID)

      if (context.config?.command === 'serve') {
        return await getExtractedCSS(context)
      }

      context.virtualCSSPlaceholderEmitted = true
      return getScanner(context).slotCSSRule
    },
    async transform(code, id) {
      return withStylesheetDependencies(context, this, id, onDependency => withSassDiagnostics(context, async () => {
        if (isRawStyleRequest(id)) return
        if (id.startsWith('\0') && context.config?.command !== 'build') return
        const dependencies = new Set<string>()
        const resolveImport = getBuildImportResolver(context, { addWatchFile: onDependency, resolve: this.resolve?.bind(this), load: this.load?.bind(this) })
        let resolution: MasterCSSStylesheetResolution | undefined
        try {
          resolution = await resolveStylesheet(id, code, {
            projectDir: context.config?.root,
            baseFile: getSassSourceFile(id),
            preserveImports: true, resolveImport, onDependency
          })
        } catch (error) {
          for (const dependency of collectStylesheetDependenciesSync(id, code, {
            projectDir: context.config?.root
          })) {
            dependencies.add(dependency)
            onDependency(dependency)
          }
          throw error
        }
        if (!resolution || (resolution.kind !== 'entry' && resolution.kind !== 'master-package-entry')) return

        for (const dependency of resolution.dependencies) {
          dependencies.add(dependency)
          onDependency(dependency)
        }

        if (resolution.kind === 'master-package-entry') {
          return {
            code: resolution.outputSource,
            map: null
          }
        }

        const inline = context.config?.command === 'build' && isInlineStylesheet(id)
        const result = inline
          ? await registerInlineStylesheet(context, id, code, { resolveImport, onDependency })
          : await registerStylesheetSource(context, context.config?.command === 'serve' ? resolution.id : id, code, { resolveImport, onDependency })
        for (const dependency of result.dependencies) {
          if (dependencies.has(dependency)) continue
          onDependency(dependency)
        }

        const masterSource = context.config?.command === 'serve'
          ? await getExtractedCSS(context)
          : getScanner(context).slotCSSRule

        if (context.config?.command === 'serve') {
          context.virtualCSSImporters ??= new Set()
          context.virtualCSSImporters.add(id)
        } else if (!inline) {
          context.virtualCSSPlaceholderEmitted = true
        }

        return {
          code: masterSource,
          map: null
        }
      }), 'entry')
    }
  }
}
