import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSServerRenderIR } from '@master/css-schema/rust-contract'
import createServerCSS, {
  createNativeRenderSession,
  createRendererServerCSS,
  ensureNativeRenderSessionClasses,
  ServerCSS,
  type ServerCSSEmittedGlobals
} from './create-server-css'
import getDefaultManifest from './default-manifest'
import parseHTML from './parse-html'
import { renderWithCSS, type RenderOptions, type RenderResult } from './render'

const DEFAULT_MAX_CACHED_CLASSES = 8192

export interface ServerRendererOptions {
  emittedGlobals?: ServerCSSEmittedGlobals
  maxCachedClasses?: number
}

export class ServerRenderer {
  readonly manifest: MasterCSSManifest
  readonly maxCachedClasses: number
  private readonly emittedGlobals?: ServerCSSEmittedGlobals
  private readonly cachedClasses = new Set<string>()
  private session
  private disposed = false

  constructor(
    manifest: MasterCSSManifest = getDefaultManifest(),
    options: ServerRendererOptions = {}
  ) {
    this.manifest = manifest
    this.emittedGlobals = options.emittedGlobals
    this.maxCachedClasses = options.maxCachedClasses ?? DEFAULT_MAX_CACHED_CLASSES
    if (
      this.maxCachedClasses !== Infinity
      && (!Number.isInteger(this.maxCachedClasses) || this.maxCachedClasses <= 0)
    ) {
      throw new TypeError('maxCachedClasses must be a positive integer or Infinity.')
    }
    this.session = createNativeRenderSession(this.manifest, this.emittedGlobals)
  }

  render(html: string, options: RenderOptions = {}): RenderResult {
    this.assertActive()
    return renderWithCSS(html, options, () => this.createCSS())
  }

  renderCSS(html: string): ServerCSS | undefined {
    this.assertActive()
    if (!html) return
    const { classes } = parseHTML(html)
    if (!classes.length) return
    const css = this.createCSS()
    css.ensureClassRules(...classes)
    return css
  }

  createCSS() {
    this.assertActive()
    return createRendererServerCSS(
      this.manifest,
      this.emittedGlobals,
      (classNames) => this.snapshotForClasses(classNames)
    )
  }

  dispose() {
    if (this.disposed) return
    this.session.dispose()
    this.cachedClasses.clear()
    this.disposed = true
  }

  private snapshotForClasses(classNames: string[]): MasterCSSServerRenderIR {
    this.assertActive()
    const classes = [...new Set(classNames.filter(Boolean))]
    if (classes.length > this.maxCachedClasses) {
      const css = createServerCSS(this.manifest, this.emittedGlobals)
      try {
        css.ensureClassRules(...classes)
        return css.snapshot()
      } finally {
        css.dispose()
      }
    }

    const newClasses = classes.filter(className => !this.cachedClasses.has(className))
    let classesToEnsure = newClasses
    if (this.cachedClasses.size + newClasses.length > this.maxCachedClasses) {
      this.session.dispose()
      this.session = createNativeRenderSession(this.manifest, this.emittedGlobals)
      this.cachedClasses.clear()
      classesToEnsure = classes
    }

    if (classesToEnsure.length) {
      ensureNativeRenderSessionClasses(this.session, classesToEnsure)
    }
    for (const className of classes) this.cachedClasses.add(className)
    return JSON.parse(this.session.snapshotForClasses(classes)) as MasterCSSServerRenderIR
  }

  private assertActive() {
    if (this.disposed) {
      throw new Error('ServerRenderer has been disposed.')
    }
  }
}

export default function createServerRenderer(
  manifest: MasterCSSManifest = getDefaultManifest(),
  options: ServerRendererOptions = {}
) {
  return new ServerRenderer(manifest, options)
}
