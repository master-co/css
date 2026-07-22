import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import CSSRuntime, {
  type MasterCSSHydrationManifest,
  type MasterCSSManifest
} from '../src'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

interface RuntimeLoaderOptions {
  manifest?: MasterCSSManifest
  hydrationManifest?: MasterCSSHydrationManifest
  startupTimeoutMs?: number
}

export async function startCSSRuntime(options: RuntimeLoaderOptions = {}) {
  return (await CSSRuntime.start({
    manifest: options.manifest || defaultManifest,
    hydrationManifest: options.hydrationManifest,
    startupTimeoutMs: options.startupTimeoutMs
  })).observe()
}

export async function startCSSRuntimeAsync(options: RuntimeLoaderOptions = {}) {
  const cssRuntime = await CSSRuntime.start({
    manifest: options.manifest || defaultManifest,
    hydrationManifest: options.hydrationManifest,
    startupTimeoutMs: options.startupTimeoutMs
  })
  return cssRuntime.observe()
}
