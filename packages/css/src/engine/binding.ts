import {
  MasterCSSError
} from '@master/css-schema'
import type { MasterCSSBinding, MasterCSSResolvedBinding } from '@master/css-binding'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSHydrationRule } from '@master/css-schema/hydration-manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export type MasterCSSRuleTarget =
  | 'theme'
  | 'base'
  | 'defaults'
  | 'components'
  | 'utilities'
  | 'keyframes'

export interface MasterCSSEngineInsertMutation {
  readonly op: 'insert'
  readonly target: MasterCSSRuleTarget
  readonly index: number
  readonly key: string
  readonly text: string
  readonly rule?: MasterCSSHydrationRule
}

export interface MasterCSSEngineDeleteMutation {
  readonly op: 'delete'
  readonly target: MasterCSSRuleTarget
  readonly index: number
  readonly key: string
}

export type MasterCSSEngineMutation =
  | MasterCSSEngineInsertMutation
  | MasterCSSEngineDeleteMutation

export interface MasterCSSEngineTransition {
  readonly version: 1
  readonly mutations: readonly MasterCSSEngineMutation[]
}

export interface MasterCSSEngineVariableResource {
  readonly name: string
  readonly refCount: number
  readonly dependencies: readonly string[]
  readonly static: boolean
}

export interface MasterCSSEngineAnimationResource {
  readonly name: string
  readonly index: number
  readonly refCount: number
  readonly text: string
}

export interface MasterCSSEngineResources {
  readonly themeText?: string
  readonly variables: readonly MasterCSSEngineVariableResource[]
  readonly animations: readonly MasterCSSEngineAnimationResource[]
}

export interface MasterCSSEngineSnapshot {
  readonly version: 1
  readonly rules: readonly MasterCSSHydrationRule[]
  readonly resources: MasterCSSEngineResources
  readonly text: string
}

export interface MasterCSSEngineInspection {
  readonly version: 1
  readonly className: string
  readonly valid: boolean
  readonly rules: readonly MasterCSSHydrationRule[]
}

export interface MasterCSSEngineBindingOptions {
  readonly manifest: MasterCSSManifest
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSEngineBinding {
  readonly kind: MasterCSSResolvedBinding
  createEngine(options: MasterCSSEngineBindingOptions): Promise<MasterCSSEngine>
  createEngineSync?(options: MasterCSSEngineBindingOptions): MasterCSSEngine
}

export interface MasterCSSEngineOptions extends MasterCSSEngineBindingOptions {
  readonly binding?: MasterCSSBinding | MasterCSSEngineBinding
}

export interface MasterCSSEngine extends Disposable {
  readonly binding: MasterCSSResolvedBinding
  ensureClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  deleteClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  refresh(manifest: MasterCSSManifest): MasterCSSEngineTransition
  inspect(className: string): MasterCSSEngineInspection
  snapshot(): MasterCSSEngineSnapshot
  dispose(): void
}

export interface BindingEngineSession {
  ensureClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  deleteClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  refresh(manifest: MasterCSSManifest): MasterCSSEngineTransition
  inspect(className: string): MasterCSSEngineInspection
  snapshot(): MasterCSSEngineSnapshot
  dispose(): void
}

export function normalizeEngineError(
  cause: unknown,
  fallbackCode = 'INTERNAL',
  fallbackMessage = 'Master CSS engine operation failed.'
): MasterCSSError {
  if (cause instanceof MasterCSSError) return cause
  return new MasterCSSError({
    code: fallbackCode,
    domain: 'engine',
    message: cause instanceof Error ? cause.message : fallbackMessage
  }, { cause })
}
