import { withMasterCSSRuntime, type MasterCSSRuntime } from '../src'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const manifest = { version: 1 } satisfies MasterCSSManifest

class RuntimeElement extends HTMLElement {
  masterCSSRuntime?: MasterCSSRuntime

  connectedCallback() {
    const runtime = this.masterCSSRuntime
    runtime?.refresh(manifest)
  }
}

withMasterCSSRuntime({ manifest })(RuntimeElement)
withMasterCSSRuntime({
  manifest,
  root: (host) => host.shadowRoot,
  emittedGlobals: {
    variables: {
      primary: 1
    }
  }
})(RuntimeElement)
