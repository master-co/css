import type { Plugin } from 'vite'
import { VIRTUAL_CSS_ID } from '@master/css-internal/style-module'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'
import getExtractedCSS from '../utils/extracted-css'
import {
  collectStylesheetDependenciesSync,
  composeStylesheetHostSync,
  resolveStylesheetSync
} from '@master/css-compiler/node'
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
      const dependencies = new Set<string>()
      let resolution: ReturnType<typeof resolveStylesheetSync>
      try {
        resolution = resolveStylesheetSync(id, code, {
          projectDir: context.config?.root
        })
      } catch (error) {
        for (const dependency of collectStylesheetDependenciesSync(id, code, {
          projectDir: context.config?.root
        })) {
          dependencies.add(dependency)
          this.addWatchFile?.(dependency)
        }
        throw error
      }
      if (!resolution || (resolution.kind !== 'entry' && resolution.kind !== 'master-package-entry')) return

      for (const dependency of resolution.dependencies) {
        dependencies.add(dependency)
        this.addWatchFile?.(dependency)
      }

      if (resolution.kind === 'master-package-entry') {
        return {
          code: resolution.outputSource,
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
        code: composeStylesheetHostSync(code, { masterSource }),
        map: null
      }
    }
  }
}
