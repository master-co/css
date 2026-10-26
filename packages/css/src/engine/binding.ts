import {
  MasterCSSError
} from '@master/css-schema'
import type { MasterCSSBinding, MasterCSSResolvedBinding } from '@master/css-binding'
import type { MasterCSSEngineBindingSession } from '@master/css-binding/engine'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSHydrationRule } from '@master/css-schema/hydration-manifest'
import type {
  MasterCSSKeyframeDefinition,
  MasterCSSManifest,
  MasterCSSManifestUtilityLayerName
} from '@master/css-schema/manifest'

type BindingEngineInspection = ReturnType<MasterCSSEngineBindingSession['inspect']>

export type MasterCSSRuleTarget =
  | 'keyframes'
  | 'theme'
  | 'base'
  | 'defaults'
  | 'components'
  | 'utilities'

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
  readonly version: 4
  readonly mutations: readonly MasterCSSEngineMutation[]
}

export interface MasterCSSEngineVariableResource {
  readonly name: string
  readonly refCount: number
  readonly dependencies: readonly string[]
}

export interface MasterCSSEngineResources {
  readonly themeText?: string
  readonly variables: readonly MasterCSSEngineVariableResource[]
  readonly keyframes: readonly (MasterCSSEngineVariableResource & { readonly id: string, readonly text: string, readonly anchored: boolean, readonly containers?: readonly { readonly id: string, readonly prelude: string }[] })[]
}

export interface MasterCSSEngineExecutionState {
  readonly classes: readonly {
    readonly className: string
    readonly references: readonly {
      readonly layer: MasterCSSManifestUtilityLayerName
      readonly key: string
    }[]
  }[]
  readonly resources: MasterCSSEngineResources
}

export interface MasterCSSEngineSnapshot {
  readonly version: 4
  readonly rules: readonly MasterCSSHydrationRule[]
  readonly resources: MasterCSSEngineResources
  readonly text: string
  readonly stylesheets?: readonly string[]
}

export interface MasterCSSEngineInspection {
  readonly version: 2
  readonly className: string
  readonly matchStatus: 'matched' | 'unmatched' | 'ambiguous' | 'syntax-error'
  readonly cssSyntaxStatus: BindingEngineInspection['cssSyntaxStatus']
  readonly cssValueStatus: 'valid' | 'invalid' | 'unknown' | 'not-checked'
  readonly browserSupport: 'supported' | 'unsupported' | 'unknown' | 'not-checked'
  readonly rules: readonly MasterCSSHydrationRule[]
  readonly diagnostics?: Readonly<BindingEngineInspection['diagnostics']>
}

/**
 * What an engine executes: a runtime program that `compileRuntimeProgram()` from
 * `@master/css/node` compiled, or a manifest, which only Node hosts compile.
 */
export type MasterCSSEngineSource =
  | { readonly program: Uint8Array, readonly manifest?: never }
  | { readonly manifest: MasterCSSManifest, readonly program?: never }

export type MasterCSSEngineBindingOptions = MasterCSSEngineSource & {
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSEngineBinding {
  readonly kind: MasterCSSResolvedBinding
  createEngine(options: MasterCSSEngineBindingOptions): Promise<MasterCSSEngine>
  createEngineSync?(options: MasterCSSEngineBindingOptions): MasterCSSEngine
}

export type MasterCSSEngineOptions = MasterCSSEngineBindingOptions & {
  readonly binding?: MasterCSSBinding | MasterCSSEngineBinding
}

export interface MasterCSSEngine extends Disposable {
  readonly binding: MasterCSSResolvedBinding
  ensureClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  deleteClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  /**
   * Adds host-owned variable counts to the active engine session.
   * Counts are cumulative for the lifetime of the session and cannot be unregistered.
   */
  registerEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals): MasterCSSEngineTransition
  replaceEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals): MasterCSSEngineTransition
  /** Executes another program or, in Node, manifest; the source kind may change. */
  refresh(source: Uint8Array | MasterCSSManifest, emittedGlobals?: MasterCSSEmittedGlobals): MasterCSSEngineTransition
  /** The keyframe definitions of the executed program, in program order. */
  keyframeDefinitions(): readonly MasterCSSKeyframeDefinition[]
  executionState(classNames: readonly string[]): MasterCSSEngineExecutionState
  inspect(className: string): MasterCSSEngineInspection
  snapshot(): MasterCSSEngineSnapshot
  dispose(): void
}

export interface BindingEngineSession {
  ensureClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  deleteClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  registerEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals): MasterCSSEngineTransition
  replaceEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals): MasterCSSEngineTransition
  refresh(source: Uint8Array | MasterCSSManifest, emittedGlobals?: MasterCSSEmittedGlobals): MasterCSSEngineTransition
  keyframeDefinitions(): readonly MasterCSSKeyframeDefinition[]
  executionState(classNames: readonly string[]): MasterCSSEngineExecutionState
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

/** The binding options of engine options, without the binding choice. */
export function engineSource(options: MasterCSSEngineOptions): MasterCSSEngineBindingOptions {
  return options.program
    ? { program: options.program, emittedGlobals: options.emittedGlobals }
    : { manifest: options.manifest, emittedGlobals: options.emittedGlobals }
}
