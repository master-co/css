import {
  createMasterCSSRuntimeBootstrapSource,
  MASTER_CSS_RUNTIME_BOOTSTRAP_ID,
  RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID
} from '@master/css-internal/runtime-bootstrap'
import type { Plugin } from 'vite'

export default function RuntimeBootstrapPlugin(): Plugin {
  return {
    name: 'master-css:runtime-bootstrap',
    resolveId(id) {
      if (id === MASTER_CSS_RUNTIME_BOOTSTRAP_ID) {
        return RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID
      }
    },
    load(id) {
      if (id === RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID) {
        return createMasterCSSRuntimeBootstrapSource()
      }
    }
  }
}
