import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSResolvedBackend } from '@master/css-backend'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  normalizeEngineError,
  type BackendEngineSession,
  type MasterCSSEngine,
  type MasterCSSEngineInspection,
  type MasterCSSEngineSnapshot,
  type MasterCSSEngineTransition
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

  ensureClassRules(classNames: readonly string[]) {
    this.assertActive()
    return this.invoke(() => freezeResult(parseResult<MasterCSSEngineTransition>(
      this.session.ensureClassRules([...classNames])
    )))
  }

  deleteClassRules(classNames: readonly string[]) {
    this.assertActive()
    return this.invoke(() => freezeResult(parseResult<MasterCSSEngineTransition>(
      this.session.deleteClassRules([...classNames])
    )))
  }

  refresh(manifest: MasterCSSManifest) {
    this.assertActive()
    return this.invoke(() => freezeResult(parseResult<MasterCSSEngineTransition>(
      this.session.refresh(manifest)
    )))
  }

  inspect(className: string) {
    this.assertActive()
    return this.invoke(() => freezeResult(
      parseResult<MasterCSSEngineInspection>(this.session.inspect(className))
    ))
  }

  snapshot() {
    this.assertActive()
    return this.invoke(() => freezeResult(
      parseResult<MasterCSSEngineSnapshot>(this.session.snapshot())
    ))
  }

  dispose() {
    if (this.disposed) return
    this.session.dispose()
    this.disposed = true
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  private assertActive() {
    if (this.disposed) {
      throw new MasterCSSError({
        code: 'SESSION_DISPOSED',
        domain: 'engine',
        message: 'Master CSS engine session has been disposed.'
      })
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

function freezeResult<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  for (const child of Object.values(value)) freezeResult(child)
  return Object.freeze(value)
}
