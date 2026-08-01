import type { InteractionModeId } from './interaction-cost'
import { retainedVolumeLevels, runtimeStyleInvalidationFixtureIds, runtimeStyleInvalidationRuntimeModeIds, runtimeStyleInvalidationStaticModeIds } from './runtime-style-invalidation-config'
import type { RuntimeStyleDiagnosticAction, RuntimeStyleDiagnosticDescriptor, RuntimeStyleDiagnosticKind } from './runtime-style-invalidation-config'
import type { BenchmarkFixtureId } from './types'

export function createRuntimeStyleInvalidationVariants(): RuntimeStyleDiagnosticDescriptor[] {
  return runtimeStyleInvalidationFixtureIds.flatMap((fixtureId) => [
    ...runtimeStyleInvalidationStaticModeIds.map((modeId) => createDescriptor({
      fixtureId,
      modeId,
      kind: 'static-baseline',
      action: 'mutation-cleanup-cycle',
      preseedTempRules: false,
      pauseObserver: false,
      retainedVolume: 0,
      labelSuffix: 'static cleanup baseline'
    })),
    ...runtimeStyleInvalidationRuntimeModeIds.flatMap((modeId) => [
      createDescriptor({
        fixtureId,
        modeId,
        kind: 'runtime-baseline',
        action: 'mutation-cleanup-cycle',
        preseedTempRules: false,
        pauseObserver: false,
        retainedVolume: 0,
        labelSuffix: 'runtime cleanup baseline'
      }),
      createDescriptor({
        fixtureId,
        modeId,
        kind: 'observer-paused',
        action: 'mutation-cleanup-cycle',
        preseedTempRules: true,
        pauseObserver: true,
        retainedVolume: 0,
        labelSuffix: 'observer paused with preseeded temp rules'
      }),
      createDescriptor({
        fixtureId,
        modeId,
        kind: 'runtime-style-idle',
        action: 'idle-window',
        preseedTempRules: true,
        pauseObserver: false,
        retainedVolume: 0,
        labelSuffix: 'runtime style idle window'
      }),
      ...retainedVolumeLevels.map((retainedVolume) => createDescriptor({
        fixtureId,
        modeId,
        kind: 'retained-volume',
        action: 'mutation-cleanup-cycle',
        preseedTempRules: true,
        pauseObserver: false,
        retainedVolume,
        labelSuffix: `preseeded temp rules with retained volume ${retainedVolume}`
      }))
    ])
  ])
}

export function filterRuntimeStyleInvalidationVariants(variants: RuntimeStyleDiagnosticDescriptor[]) {
  const value = process.env.RUNTIME_STYLE_INVALIDATION_DIAGNOSTIC_VARIANT
  if (!value) return variants
  const filtered = variants.filter((variant) => variant.id === value)
  if (!filtered.length) {
    throw new Error(`No runtime style invalidation diagnostic variant matched ${JSON.stringify(value)}.`)
  }
  return filtered
}

function createDescriptor(options: {
  fixtureId: BenchmarkFixtureId
  modeId: InteractionModeId
  kind: RuntimeStyleDiagnosticKind
  action: RuntimeStyleDiagnosticAction
  preseedTempRules: boolean
  pauseObserver: boolean
  retainedVolume: number
  labelSuffix: string
}): RuntimeStyleDiagnosticDescriptor {
  return {
    id: createRuntimeStyleInvalidationVariantId(options),
    fixtureId: options.fixtureId,
    adapterId: options.modeId === 'tailwind-static' ? 'tailwind-cli' : options.modeId,
    label: `${options.fixtureId} / ${formatModeLabel(options.modeId)} / ${options.labelSuffix}`,
    modeId: options.modeId,
    kind: options.kind,
    action: options.action,
    preseedTempRules: options.preseedTempRules,
    pauseObserver: options.pauseObserver,
    retainedVolume: options.retainedVolume
  }
}

function createRuntimeStyleInvalidationVariantId(options: {
  fixtureId: BenchmarkFixtureId
  modeId: InteractionModeId
  kind: RuntimeStyleDiagnosticKind
  retainedVolume: number
}) {
  const suffix = options.kind === 'retained-volume'
    ? `retained-${options.retainedVolume}`
    : options.kind
  return `${options.fixtureId}-${options.modeId}-style-invalidation-${suffix}`
}

function formatModeLabel(modeId: InteractionModeId) {
  switch (modeId) {
    case 'master-static':
      return 'Master CSS static'
    case 'master-runtime':
      return 'Master CSS runtime'
    case 'master-progressive':
      return 'Master CSS progressive'
    case 'tailwind-static':
      return 'Tailwind CSS static'
  }
}
