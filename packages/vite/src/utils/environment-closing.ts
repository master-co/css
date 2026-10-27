interface ClosingState {
  closing: boolean
  callbacks: Set<() => void>
}
interface ClosableEnvironment { close(): Promise<void> }
const states = new WeakMap<object, ClosingState>()

/** closeBundle runs after pending hooks; cancel adapter work when close begins. */
export function onEnvironmentClosing(environment: object, callback: () => void) {
  let state = states.get(environment)
  if (!state) {
    const owner = environment as ClosableEnvironment
    if (typeof owner.close !== 'function') return
    const close = owner.close
    state = { closing: false, callbacks: new Set() }
    states.set(environment, state)
    const tracked = state
    owner.close = function () {
      if (!tracked.closing) {
        tracked.closing = true
        for (const cancel of tracked.callbacks) cancel()
        tracked.callbacks.clear()
      }
      return close.call(this)
    }
  }
  if (state.closing) callback()
  else state.callbacks.add(callback)
}
