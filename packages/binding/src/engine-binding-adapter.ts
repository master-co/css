import { MasterCSSError } from '@master/css-schema'
import type {
  MasterCSSEngineBindingSession,
  MasterCSSRenderBindingSession
} from './engine-binding'
import { callBinding } from './normalize-error'

function assertActive(disposed: boolean, domain: 'engine' | 'server') {
  if (!disposed) return
  throw new MasterCSSError({
    code: 'SESSION_DISPOSED',
    domain,
    message: `The Master CSS ${domain} binding session has been disposed.`
  })
}

export function bindEngineBindingSession(
  binding: MasterCSSEngineBindingSession['binding'],
  session: Omit<MasterCSSEngineBindingSession, 'binding'>
): MasterCSSEngineBindingSession {
  let disposed = false
  const invoke = <T>(operation: () => T) => {
    assertActive(disposed, 'engine')
    return callBinding('engine', operation)
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    session.dispose()
  }
  const bound: MasterCSSEngineBindingSession = {
    binding,
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

export function bindRenderBindingSession(
  binding: MasterCSSRenderBindingSession['binding'],
  session: Omit<MasterCSSRenderBindingSession, 'binding'>
): MasterCSSRenderBindingSession {
  let disposed = false
  const invoke = <T>(operation: () => T) => {
    assertActive(disposed, 'server')
    return callBinding('server', operation)
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    session.dispose()
  }
  const bound: MasterCSSRenderBindingSession = {
    binding,
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
