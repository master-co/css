import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import type { MasterCSSEngineSnapshot } from '@master/css'

interface MasterCSSRenderBindingResult {
  readonly classes: string[]
  readonly snapshot: MasterCSSEngineSnapshot
  readonly hydrationManifest: MasterCSSHydrationManifest
}

export interface RenderCompiledManifestCSSOptions {
  manifest: MasterCSSManifest
  classNames?: Iterable<string>
  nativeCSS?: string | string[]
  includeGeneratedCSS?: boolean
  emittedGlobals?: MasterCSSEmittedGlobals
}

export interface RenderCompiledManifestCSSResult {
  css: string
  nativeCSS: string
  generatedCSS: string
  emittedGlobals: Required<MasterCSSEmittedGlobals>
}

export interface StylesheetRenderSession {
  ensureClasses(classNames: string[]): void
  ensureStylesheetResources(nativeCSS: string): void
  emittedGlobals(): Required<MasterCSSEmittedGlobals>
  snapshot(): MasterCSSRenderBindingResult
  dispose(): void
}

export function normalizeNativeCSS(nativeCSS: string | string[] | undefined) {
  return (Array.isArray(nativeCSS) ? nativeCSS : [nativeCSS])
    .filter((source): source is string => Boolean(source))
    .map((source) => source.replace(/\r\n?/g, '\n'))
}

export function renderCompiledManifestCSSWithSession(
  options: RenderCompiledManifestCSSOptions,
  session: StylesheetRenderSession
): RenderCompiledManifestCSSResult {
  const nativeCSS = normalizeNativeCSS(options.nativeCSS)
  const nativeCSSText = nativeCSS.join('\n\n')
  if (options.includeGeneratedCSS !== false) {
    const classNames = [...(options.classNames || [])]
    session.ensureClasses(classNames)
  }
  session.ensureStylesheetResources(nativeCSSText)
  const generatedCSS = session.snapshot().snapshot.text

  return {
    css: [nativeCSSText, generatedCSS].filter(Boolean).join('\n\n'),
    nativeCSS: nativeCSSText,
    generatedCSS,
    emittedGlobals: session.emittedGlobals()
  }
}
