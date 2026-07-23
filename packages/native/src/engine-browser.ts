import { MasterCSSError } from '@master/css-schema'
import type {
  MasterCSSNativeEngineSession,
  MasterCSSNativeEngineSessionOptions,
  MasterCSSNativeModuleOptions,
  MasterCSSNativeRenderSession
} from './engine-contract'

export type {
  MasterCSSNativeEngineSession,
  MasterCSSNativeEngineSessionOptions,
  MasterCSSNativeModuleOptions,
  MasterCSSNativeRenderSession
} from './engine-contract'
export {
  MASTER_CSS_ENGINE_TRANSITION_VERSION,
  type MasterCSSEngineAnimationResource,
  type MasterCSSEngineDeleteMutation,
  type MasterCSSEngineInspection,
  type MasterCSSEngineInsertMutation,
  type MasterCSSEngineMutation,
  type MasterCSSEngineResources,
  type MasterCSSEngineSnapshot,
  type MasterCSSEngineTransition,
  type MasterCSSEngineVariableResource,
  type MasterCSSNativeDeclarationCandidate,
  type MasterCSSRuleTarget,
  type MasterCSSServerRender
} from './protocol'

function unavailable(required: boolean | undefined) {
  if (!required) return
  throw new MasterCSSError({
    code: 'NATIVE_UNAVAILABLE',
    domain: 'backend',
    message: 'Master CSS native bindings are unavailable in browsers.'
  })
}

export function createNativeEngineSession(
  _options: MasterCSSNativeEngineSessionOptions,
  moduleOptions: MasterCSSNativeModuleOptions = {}
): MasterCSSNativeEngineSession | undefined {
  unavailable(moduleOptions.required)
  return undefined
}

export function createNativeRenderSession(
  _options: MasterCSSNativeEngineSessionOptions,
  moduleOptions: MasterCSSNativeModuleOptions = {}
): MasterCSSNativeRenderSession | undefined {
  unavailable(moduleOptions.required)
  return undefined
}
