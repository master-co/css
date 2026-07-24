import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSResolvedBinding } from '@master/css-binding'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  normalizeEngineError,
  type BindingEngineSession,
  type MasterCSSEngine,
  type MasterCSSEngineInspection,
  type MasterCSSEngineSnapshot,
  type MasterCSSEngineTransition
} from './binding'

export default class BoundEngine implements MasterCSSEngine {
  private disposed = false

  constructor(
    public readonly binding: MasterCSSResolvedBinding,
    private readonly session: BindingEngineSession
  ) { }

  ensureClassRules(classNames: readonly string[]) {
    this.assertActive()
    return this.invoke(() => freezeResult<MasterCSSEngineTransition>(
      this.session.ensureClassRules([...classNames])
    ))
  }

  deleteClassRules(classNames: readonly string[]) {
    this.assertActive()
    return this.invoke(() => freezeResult<MasterCSSEngineTransition>(
      this.session.deleteClassRules([...classNames])
    ))
  }

  refresh(manifest: MasterCSSManifest) {
    this.assertActive()
    return this.invoke(() => freezeResult<MasterCSSEngineTransition>(
      this.session.refresh(manifest)
    ))
  }

  inspect(className: string) {
    this.assertActive()
    return this.invoke(() => freezeResult<MasterCSSEngineInspection>(
      this.session.inspect(className)
    ))
  }

  snapshot() {
    this.assertActive()
    return this.invoke(() => freezeResult<MasterCSSEngineSnapshot>(
      this.session.snapshot()
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
