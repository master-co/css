import type { InteractionModeId } from './interaction-cost'
import type { BenchmarkFixtureId, BenchmarkVariant } from './types'

export type RuntimeStyleDiagnosticKind =
  | 'static-baseline'
  | 'runtime-baseline'
  | 'observer-paused'
  | 'runtime-style-idle'
  | 'retained-volume'

export type RuntimeStyleDiagnosticAction = 'mutation-cleanup-cycle' | 'idle-window'

export interface RuntimeStyleDiagnosticDescriptor extends BenchmarkVariant {
  modeId: InteractionModeId
  kind: RuntimeStyleDiagnosticKind
  action: RuntimeStyleDiagnosticAction
  preseedTempRules: boolean
  pauseObserver: boolean
  retainedVolume: number
}

export const fixedViewport = {
  width: 1280,
  height: 720
}

export const runtimeStyleInvalidationFixtureIds = [
  'dynamic',
  'stress-dom'
] satisfies BenchmarkFixtureId[]

export const runtimeStyleInvalidationRuntimeModeIds = [
  'master-runtime',
  'master-progressive'
] satisfies InteractionModeId[]

export const runtimeStyleInvalidationStaticModeIds = [
  'master-static',
  'tailwind-static'
] satisfies InteractionModeId[]

export const retainedVolumeLevels = [0, 2, 128, 512]
