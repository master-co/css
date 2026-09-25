import { registerHooks } from 'node:module'

// Content generation evaluates presentation modules without a CSS bundler.
registerHooks({
  load(url, context, nextLoad) {
    if (new URL(url).pathname.endsWith('.css')) return { format: 'module', source: '', shortCircuit: true }
    return nextLoad(url, context)
  }
})
