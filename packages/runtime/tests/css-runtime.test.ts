import { withMasterCSSRuntime, type MasterCSSRuntime } from '../src'

const program = new Uint8Array()

class RuntimeElement extends HTMLElement {
  masterCSSRuntime?: MasterCSSRuntime

  connectedCallback() {
    const runtime = this.masterCSSRuntime
    runtime?.refresh(program)
  }
}

withMasterCSSRuntime({ program })(RuntimeElement)
withMasterCSSRuntime({
  program: async () => (await fetch('/master-css-program.bin')).arrayBuffer(),
  root: (host) => host.shadowRoot,
  emittedGlobals: {
    variables: {
      primary: 1
    }
  }
})(RuntimeElement)
withMasterCSSRuntime({
  program: (host) => host.dataset.program === 'empty' ? new ArrayBuffer(0) : program
})(RuntimeElement)
