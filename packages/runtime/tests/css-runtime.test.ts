import { cssRuntime } from '../src'
import type { CSSRuntime } from '../src'
import type { MasterCSSPlan } from 'shared/master-css-plan'

const plan = { version: 3 } satisfies MasterCSSPlan

class RuntimeElement extends HTMLElement {
    cssRuntime?: CSSRuntime

    connectedCallback() {
        const runtime: CSSRuntime | undefined = this.cssRuntime
        runtime?.refresh(plan)
    }
}

cssRuntime({ plan })(RuntimeElement)
cssRuntime({
    plan,
    root: (host) => host.shadowRoot,
    autoObserve: false,
    preloaded: {
        variables: {
            primary: 1
        }
    }
})(RuntimeElement)
