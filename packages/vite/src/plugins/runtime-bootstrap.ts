import {
  createMasterCSSRuntimeBootstrapSource,
  MASTER_CSS_RUNTIME_BOOTSTRAP_ID,
  RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID
} from '@master/css-internal/runtime-bootstrap'
import type { Plugin } from 'vite'

export default function RuntimeBootstrapPlugin(): Plugin {
  let stylesheetDelivery: string | undefined
  return {
    name: 'master-css:runtime-bootstrap',
    configResolved(config) {
      const base = config.base && config.base !== './' ? JSON.stringify(config.base) : `new URL(/* @vite-ignore */ '/', import.meta.url).href`
      stylesheetDelivery = `{ base: ${base}, development: ${config.command === 'serve'} }`
    },
    resolveId(id) {
      if (id === MASTER_CSS_RUNTIME_BOOTSTRAP_ID) {
        return RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID
      }
    },
    load(id) {
      if (id === RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID) {
        return createMasterCSSRuntimeBootstrapSource(stylesheetDelivery)
      }
    }
  }
}
