import type { MasterCSSManifest } from '@master/css'
import { createEngineSync } from '@master/css/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { createValidatorSync } from '@master/css-tooling/validator/node'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const presetValidator = createValidatorSync(defaultManifest)

export const presetBreakpointConditions = defaultManifest.breakpointConditions || {}
export const presetContainerConditions = defaultManifest.containerConditions || {}

export const createPresetEngine = () => {
  return createEngineSync({ manifest: defaultManifest })
}

export const generatePresetClasses = (classNames: readonly string[]) => {
  return presetValidator.generate(classNames)
}
