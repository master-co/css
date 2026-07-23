import { MasterCSSError } from '@master/css-schema'
import type {
  MasterCSSEngineBackendSession,
  MasterCSSRenderBackendSession
} from './broker-engine'
import { callBackend } from './normalize-error'

function assertActive(disposed: boolean, domain: 'engine' | 'server') {
  if (!disposed) return
  throw new MasterCSSError({
    code: 'SESSION_DISPOSED',
    domain,
    message: `The Master CSS ${domain} backend session has been disposed.`
  })
}

export function bindEngineBackendSession(
  backend: MasterCSSEngineBackendSession['backend'],
  session: Omit<MasterCSSEngineBackendSession, 'backend'>
): MasterCSSEngineBackendSession {
  let disposed = false
  const invoke = <T>(operation: () => T) => {
    assertActive(disposed, 'engine')
    return callBackend('engine', operation)
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    session.dispose()
  }
  const bound: MasterCSSEngineBackendSession = {
    backend,
    ensureClassRules: (classNames) => invoke(() => session.ensureClassRules(classNames)),
    deleteClassRules: (classNames) => invoke(() => session.deleteClassRules(classNames)),
    refresh: (manifest) => invoke(() => session.refresh(manifest)),
    inspect: (className) => invoke(() => session.inspect(className)),
    snapshot: () => invoke(() => session.snapshot()),
    dispose,
    [Symbol.dispose]: dispose
  }
  return Object.freeze(bound)
}

export function bindRenderBackendSession(
  backend: MasterCSSRenderBackendSession['backend'],
  session: Omit<MasterCSSRenderBackendSession, 'backend'>
): MasterCSSRenderBackendSession {
  let disposed = false
  const invoke = <T>(operation: () => T) => {
    assertActive(disposed, 'server')
    return callBackend('server', operation)
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    session.dispose()
  }
  const bound: MasterCSSRenderBackendSession = {
    backend,
    nativeDeclarationCandidates: (classNames) =>
      invoke(() => session.nativeDeclarationCandidates(classNames)),
    ensureClassRules: (classNames, nativeSupport) =>
      invoke(() => session.ensureClassRules(classNames, nativeSupport)),
    ensureStylesheetResources: (nativeCSS) =>
      invoke(() => session.ensureStylesheetResources(nativeCSS)),
    emittedGlobals: () => invoke(() => session.emittedGlobals()),
    snapshot: () => invoke(() => session.snapshot()),
    snapshotForClassNames: (classNames) =>
      invoke(() => session.snapshotForClassNames(classNames)),
    dispose,
    [Symbol.dispose]: dispose
  }
  return Object.freeze(bound)
}
