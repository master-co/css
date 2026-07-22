import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type {
  MasterCSSEngineSnapshotIR,
  MasterCSSEngineInspectionIR,
  MasterCSSEngineTransitionIR,
  MasterCSSResolvedBackend
} from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  MasterCSSEngineError,
  normalizeEngineError,
  type BackendEngineSession,
  type MasterCSSEngine
} from './backend'

function parseResult<T>(value: T | string): T {
  return typeof value === 'string' ? JSON.parse(value) as T : value
}

export default class BoundEngine implements MasterCSSEngine {
  private disposed = false

  constructor(
    public readonly backend: MasterCSSResolvedBackend,
    private readonly session: BackendEngineSession
  ) { }

  get text() {
    return this.snapshot().text
  }

  ensureClassRules(classNames: readonly string[]) {
    this.assertActive()
    return this.invoke(() => parseResult<MasterCSSEngineTransitionIR>(
      this.session.ensureClassRules([...classNames])
    ))
  }

  deleteClassRules(classNames: readonly string[]) {
    this.assertActive()
    return this.invoke(() => parseResult<MasterCSSEngineTransitionIR>(
      this.session.deleteClassRules([...classNames])
    ))
  }

  refresh(manifest: MasterCSSManifest) {
    this.assertActive()
    return this.invoke(() => parseResult<MasterCSSEngineTransitionIR>(
      this.session.refresh(stringifyMasterCSSManifestJSON(manifest))
    ))
  }

  inspect(className: string) {
    this.assertActive()
    return this.invoke(() => parseResult<MasterCSSEngineInspectionIR>(this.session.inspect(className)))
  }

  snapshot() {
    this.assertActive()
    return this.invoke(() => parseResult<MasterCSSEngineSnapshotIR>(this.session.snapshot()))
  }

  dispose() {
    if (this.disposed) return
    this.session.dispose()
    this.disposed = true
  }

  private assertActive() {
    if (this.disposed) {
      throw new MasterCSSEngineError('SESSION_DISPOSED', 'Master CSS engine session has been disposed.')
    }
  }

  private invoke<T>(operation: () => T): T {
    try {
      return operation()
    } catch (cause) {
      throw normalizeEngineError(cause)
    }
  }
}
