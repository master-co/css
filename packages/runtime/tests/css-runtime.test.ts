import { cssRuntime } from '../src'
import type { Config } from '@master/css'
import type { CSSRuntime } from '../src'

class RuntimeElement extends HTMLElement {
    cssRuntime?: CSSRuntime

    connectedCallback() {
        const runtime: CSSRuntime | undefined = this.cssRuntime
        runtime?.refresh({})
    }
}

cssRuntime()(RuntimeElement)
cssRuntime({ config: { variables: [] } satisfies Config })(RuntimeElement)
cssRuntime({
    config: {} satisfies Config,
    root: (host) => host.shadowRoot,
    autoObserve: false
})(RuntimeElement)
