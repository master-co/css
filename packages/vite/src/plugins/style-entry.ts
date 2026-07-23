import type { Plugin } from 'vite'
import { VIRTUAL_CSS_ID } from '@master/css-build-internal/style-module'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'
import getExtractedCSS from '../utils/extracted-css'
import {
  collectStylesheetDependencies,
  createStylesheetHostSource,
  isMasterCSSPackageStyleFile,
  isStylesheetRequest,
  removeMasterStyleDirectives,
  resolveMasterStyleSource
} from '@master/css-compiler/stylesheet'
import { registerStylesheetSource } from '../utils/register-style-source'
import { getScanner } from '../utils/scanner-context'

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
      if (id.startsWith('\0')) return
      if (!isStylesheetRequest(id)) return
      const dependencies = new Set<string>()
      let resolvedStyleSource: ReturnType<typeof resolveMasterStyleSource>
      try {
        resolvedStyleSource = resolveMasterStyleSource(id, code, context.config?.root)
      } catch (error) {
        for (const dependency of collectStylesheetDependencies(id, code, context.config?.root)) {
          dependencies.add(dependency)
          this.addWatchFile?.(dependency)
        }
        throw error
      }
      if (!resolvedStyleSource) return

      for (const dependency of collectStylesheetDependencies(id, code, context.config?.root)) {
        dependencies.add(dependency)
        this.addWatchFile?.(dependency)
      }

      if (isMasterCSSPackageStyleFile(id, context.config?.root)) {
        return {
          code: removeMasterStyleDirectives(code).code,
          map: null
        }
      }

      const result = await registerStylesheetSource(context, id, code)
      for (const dependency of result.dependencies) {
        if (dependencies.has(dependency)) continue
        this.addWatchFile?.(dependency)
      }

      const masterSource = context.config?.command === 'serve'
        ? await getExtractedCSS(context)
        : getScanner(context).slotCSSRule

      if (context.config?.command === 'serve') {
        context.virtualCSSImporters ??= new Set()
        context.virtualCSSImporters.add(id)
      } else {
        context.virtualCSSPlaceholderEmitted = true
      }

      return {
        code: createStylesheetHostSource(code, { masterSource }),
        map: null
      }
    }
  }
}
