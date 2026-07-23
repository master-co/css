import {
  createRenderSessionSync,
  renderClassNamesSync,
  type MasterCSSRenderSession,
  type MasterCSSRenderSessionOptions,
  type MasterCSSRenderSnapshot
} from '@master/css/node'
import { MasterCSSError } from '@master/css-schema'
import { supportsNativeDeclaration } from '@master/css-tooling/node'
import {
  bindHTMLRenderSessionInternal
} from './html-render-session'
import parseHTML from './parse-html'
import {
  renderHTMLWithSnapshot,
  type MasterCSSHTMLDocumentOptions,
  type MasterCSSHTMLRenderResult
} from './render'

const DEFAULT_MAX_CACHED_CLASSES = 8192

export interface MasterCSSServerRendererOptions extends Omit<
  MasterCSSRenderSessionOptions,
  'supportsNativeDeclaration'
> {
  readonly maxCachedClasses?: number
}

let bindServerRenderer: (
  options: MasterCSSServerRendererOptions
) => MasterCSSServerRenderer

export class MasterCSSServerRenderer implements Disposable {
  readonly maxCachedClasses: number
  private readonly cachedClassNames = new Set<string>()
  private renderSession: MasterCSSRenderSession
  private disposed = false

  private constructor(private readonly options: MasterCSSServerRendererOptions) {
    this.maxCachedClasses = options.maxCachedClasses ?? DEFAULT_MAX_CACHED_CLASSES
    if (
      this.maxCachedClasses !== Infinity
      && (!Number.isInteger(this.maxCachedClasses) || this.maxCachedClasses <= 0)
    ) {
      throw new TypeError('maxCachedClasses must be a positive integer or Infinity.')
    }
    this.renderSession = this.createRenderSession()
  }

  renderHTML(
    html: string,
    options: MasterCSSHTMLDocumentOptions = {}
  ): MasterCSSHTMLRenderResult {
    this.assertActive()
    const classNames = parseHTML(html).classes
    const snapshot = classNames.length ? this.renderClassNames(classNames) : undefined
    return renderHTMLWithSnapshot(html, classNames, snapshot, options)
  }

  createHTMLRenderSession(options: MasterCSSHTMLDocumentOptions = {}) {
    this.assertActive()
    return bindHTMLRenderSessionInternal(this, options)
  }

  dispose() {
    if (this.disposed) return
    this.renderSession.dispose()
    this.cachedClassNames.clear()
    this.disposed = true
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  private renderClassNames(classNames: readonly string[]): MasterCSSRenderSnapshot {
    const classes = [...new Set(classNames.filter(Boolean))]
    if (classes.length > this.maxCachedClasses) {
      return renderClassNamesSync(classes, this.renderOptions())
    }

    const newClassNames = classes.filter((className) => !this.cachedClassNames.has(className))
    let classesToEnsure = newClassNames
    if (this.cachedClassNames.size + newClassNames.length > this.maxCachedClasses) {
      this.renderSession.dispose()
      this.renderSession = this.createRenderSession()
      this.cachedClassNames.clear()
      classesToEnsure = classes
    }

    if (classesToEnsure.length) this.renderSession.ensureClassRules(classesToEnsure)
    for (const className of classes) this.cachedClassNames.add(className)
    return this.renderSession.snapshotForClassNames(classes)
  }

  private renderOptions(): MasterCSSRenderSessionOptions {
    return {
      manifest: this.options.manifest,
      emittedGlobals: this.options.emittedGlobals,
      supportsNativeDeclaration: supportsNativeDeclaration
    }
  }

  private createRenderSession() {
    return createRenderSessionSync(this.renderOptions())
  }

  private assertActive() {
    if (this.disposed) {
      throw new MasterCSSError({
        code: 'SESSION_DISPOSED',
        domain: 'server',
        message: 'The Master CSS server renderer has been disposed.'
      })
    }
  }

  static {
    bindServerRenderer = (options) => new MasterCSSServerRenderer(options)
  }
}

export function createServerRenderer(
  options: MasterCSSServerRendererOptions
): MasterCSSServerRenderer {
  return bindServerRenderer(options)
}
