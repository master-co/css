import { createEngineBindingSession } from '@master/css-binding/engine'
import BoundEngine from './bound-engine'
import {
  type MasterCSSEngine,
  type MasterCSSEngineOptions
} from './binding'

export default async function createEngine(
  options: MasterCSSEngineOptions
): Promise<MasterCSSEngine> {
  if (options.binding && typeof options.binding === 'object') {
    return await options.binding.createEngine({
      manifest: options.manifest,
      emittedGlobals: options.emittedGlobals
    })
  }
  const session = await createEngineBindingSession(options, {
    binding: options.binding
  })
  return new BoundEngine(session.binding, session)
}
