import type { BenchmarkArtifact, BenchmarkFixtureId, BenchmarkSample, BenchmarkVariant } from './types'

export type InteractionModeId =
  | 'master-static'
  | 'master-runtime'
  | 'master-progressive'
  | 'tailwind-static'

export type InteractionScenarioId =
  | 'existing-class-toggle'
  | 'new-class-toggle'
  | 'dom-append-remove'
  | 'theme-switch'
  | 'viewport-resize'
  | 'mutation-cleanup-cycle'

export type RuntimeMutationStrategyId =
  | 'baseline'
  | 'defer-remove'
  | 'suppress-remove-during-trace'

export interface ChromeTraceEvent {
  name?: string
  ph?: string
  dur?: number
}

export interface InteractionModeDescriptor {
  id: InteractionModeId
  adapterId: 'master-static' | 'master-runtime' | 'master-progressive' | 'tailwind-cli'
  label: string
}

interface InteractionScenarioDescriptor {
  id: InteractionScenarioId
  label: string
  description: string
}

export type InteractionPageSuite =
  | 'interaction-cost'
  | 'runtime-mutation-diagnostics'
  | 'runtime-style-invalidation-diagnostics'

export interface InteractionPage {
  root: string
  artifacts: BenchmarkArtifact[]
}

export interface InteractionMeasurement {
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

export interface InteractionResult {
  elapsedMs: number
  runtimeMutationMs: number
  runtimeGeneratedRuleCountDelta: number
  runtimeStyleRawBytesDelta: number
  domNodeCount: number
  affectedElementCount: number
  computedStyleValid: number
  cleanupValid: number
  progressiveAdopted: number
  runtimeStyleText: string
  details: Record<string, unknown>
}

export interface RetainedRuleState {
  retainedClassNames: string[]
  retainedClassRuleCount: number
  retainedClassRawBytes: number
}

export interface RuntimeState {
  runtimeAvailable: boolean
  progressiveAdopted: number
  runtimeGeneratedRuleCount: number
  runtimeStyleRawBytes: number
  runtimeStyleText: string
  classCounts: Record<string, number>
  classUtilityNames: string[]
  retainedClassNames: string[]
  retainedClassRuleCount: number
  retainedClassRawBytes: number
  domNodeCount: number
}

export interface InteractionClassModel {
  family: 'master' | 'tailwind'
  body: string[]
  shell: string[]
  header: string[]
  title: string[]
  subtitle: string[]
  grid: string[]
  itemBase: string[]
  itemLight: string[]
  itemActive: string[]
  itemDark: string[]
  itemNew: string[]
  itemTemp: string[]
  itemTitle: string[]
  itemMeta: string[]
  panel: string[]
  button: string[]
}

export const fixedViewport = {
  width: 1280,
  height: 720
}

export const interactionFixtureIds = [
  'dynamic',
  'dashboard',
  'stress-dom'
] satisfies BenchmarkFixtureId[]

export const interactionModes = [
  {
    id: 'master-static',
    adapterId: 'master-static',
    label: 'Master CSS static'
  },
  {
    id: 'master-runtime',
    adapterId: 'master-runtime',
    label: 'Master CSS runtime'
  },
  {
    id: 'master-progressive',
    adapterId: 'master-progressive',
    label: 'Master CSS progressive'
  },
  {
    id: 'tailwind-static',
    adapterId: 'tailwind-cli',
    label: 'Tailwind CSS static'
  }
] satisfies InteractionModeDescriptor[]

export const interactionScenarios = [
  {
    id: 'existing-class-toggle',
    label: 'Existing class toggle',
    description: 'Toggle state classes that already exist in the delivered or hydrated CSS.'
  },
  {
    id: 'new-class-toggle',
    label: 'New class toggle',
    description: 'Toggle a class absent from initial CSS so Master runtime/progressive has to generate a rule.'
  },
  {
    id: 'dom-append-remove',
    label: 'DOM append/remove',
    description: 'Insert and remove repeated components using already-known classes.'
  },
  {
    id: 'theme-switch',
    label: 'Theme switch',
    description: 'Switch repeated items between light and dark utility class sets.'
  },
  {
    id: 'viewport-resize',
    label: 'Viewport resize',
    description: 'Resize the viewport with the same DOM and CSS to capture recalculation/layout cost.'
  },
  {
    id: 'mutation-cleanup-cycle',
    label: 'Mutation cleanup cycle',
    description: 'Repeat insert/remove cycles and verify temporary runtime classes are cleaned up.'
  }
] satisfies InteractionScenarioDescriptor[]
