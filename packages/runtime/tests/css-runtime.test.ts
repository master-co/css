import { cssRuntime } from '../src'
import type { CSSRuntime } from '../src'
import type { MasterCSSManifest } from 'shared/master-css-manifest'

const manifest = { version: 1 } satisfies MasterCSSManifest

class RuntimeElement extends HTMLElement {
    cssRuntime?: CSSRuntime

    connectedCallback() {
        const runtime: CSSRuntime | undefined = this.cssRuntime
        runtime?.refresh(manifest)
    }
}

cssRuntime({ manifest })(RuntimeElement)
cssRuntime({
    manifest,
    root: (host) => host.shadowRoot,
    autoObserve: false,
    emittedGlobals: {
        variables: {
            primary: 1
        }
    }
})(RuntimeElement)
