import { createEngineBackendSession } from '@master/css-backend/engine'
import BoundEngine from './bound-engine'
import {
  type MasterCSSEngine,
  type MasterCSSEngineOptions
} from './backend'

export default async function createEngine(
  options: MasterCSSEngineOptions
): Promise<MasterCSSEngine> {
  if (options.backend && typeof options.backend === 'object') {
    return await options.backend.createEngine({
      manifest: options.manifest,
      emittedGlobals: options.emittedGlobals
    })
  }
  const session = await createEngineBackendSession(options, {
    backend: options.backend
  })
  return new BoundEngine(session.backend, session)
}
