import { createEngineSync } from '@master/css/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '@master/css-tooling/node'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const presetTooling = createToolingSessionSync({ manifest: defaultManifest })

export const presetBreakpointQueries = Object.fromEntries(Object.entries(defaultManifest.customMedia || {}).map(([name, expression]) => {
  if (expression.type !== 'feature') throw new Error(`Preset breakpoint ${name} needs a documentation query renderer`)
  return [name.slice(2), `@media ${expression.value}`]
}))
export const presetContainerConditions = defaultManifest.containerConditions || {}

export const createPresetEngine = () => {
  return createEngineSync({ manifest: defaultManifest })
}

export const generatePresetClasses = (classNames: readonly string[]) => {
  return presetTooling.validateClassNames(classNames)
}
