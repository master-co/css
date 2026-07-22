import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import CSSRuntime, { type MasterCSSHydrationManifest, type MasterCSSManifest } from '../src'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export async function startCSSRuntime(options: { manifest?: MasterCSSManifest, hydrationManifest?: MasterCSSHydrationManifest } = {}) {
  return (await CSSRuntime.start({
    manifest: options.manifest || defaultManifest,
    hydrationManifest: options.hydrationManifest
  })).observe()
}

export async function startCSSRuntimeAsync(options: { manifest?: MasterCSSManifest, hydrationManifest?: MasterCSSHydrationManifest } = {}) {
  const cssRuntime = await CSSRuntime.start({
    manifest: options.manifest || defaultManifest,
    hydrationManifest: options.hydrationManifest
  })
  return cssRuntime.observe()
}
