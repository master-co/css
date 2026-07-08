import { registerStyleCSSSource as registerStylesheetCSSSource } from '@master/css-stylesheet'
import type { PluginContext } from '../core'
import { getScanner } from './scanner-context'

export async function registerStyleCSSSource(context: PluginContext, id: string, source: string) {
  context.styleCSSSources ??= new Map()
  return registerStylesheetCSSSource(getScanner(context), context.styleCSSSources, id, source, {
    projectDir: context.config?.root
  })
}
