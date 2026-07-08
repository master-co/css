import log from './log'
export { default as debugRuntimeMutation } from './class-count'
export {
  debugRuntimeCreated,
  debugRuntimeDestroyed,
  debugRuntimeDisconnected,
  debugRuntimeHydrated,
  debugRuntimeObserved,
  debugRuntimeRefreshed
} from './lifecycle'

export default function startDebuggers() {
  log.info('Debug mode is enabled by default in development.')
}
