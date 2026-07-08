import snapshot from '~/site/../benchmarks/interaction-cost/snapshot.json'
import { BenchmarkBars, BenchmarkMetricTable, type BenchmarkBarItem, type BenchmarkColor, type BenchmarkMetric } from '~/site/components/benchmarks'
import ExpandContent from 'internal/components/ExpandContent'

type ModeId = 'master-static' | 'master-runtime' | 'master-progressive' | 'tailwind-static'
type ScenarioId =
  | 'existing-class-toggle'
  | 'new-class-toggle'
  | 'dom-append-remove'
  | 'theme-switch'
  | 'viewport-resize'
  | 'mutation-cleanup-cycle'

type SummaryStats = {
  min: number
  median: number
  mean: number
  max: number
  sampleCount: number
  unit: string
}

type InteractionVariantResult = {
  variantId: string
  interaction: {
    readyMs: SummaryStats
    runtimeMutationMs: SummaryStats
    runtimeGeneratedRuleCountDelta: SummaryStats
    runtimeStyleRawBytesDelta: SummaryStats
  }
  browser: {
    styleRecalculationMs: SummaryStats
    layoutMs: SummaryStats
    paintMs: SummaryStats
    longTaskCount: SummaryStats
  }
  dom: {
    nodeCount: SummaryStats
    affectedElementCount: SummaryStats
  }
  correctness: {
    computedStyleValid: SummaryStats
    cleanupValid: SummaryStats
    progressiveAdopted: SummaryStats
  }
}

type InteractionFixtureResult = {
  fixtureId: string
  scenarios: Record<ScenarioId, Partial<Record<ModeId, InteractionVariantResult>>>
}

type ModeDescriptor = {
  id: ModeId
  label: string
  family: string
}

type ScenarioDescriptor = {
  id: ScenarioId
  label: string
}

type FixtureDescriptor = {
  id: string
  name: string
  purpose: string
}

const primaryFixtureId = 'dynamic'
const browser = (snapshot as { browser?: { name: string; version: string } }).browser
const fixtures = snapshot.fixtures as FixtureDescriptor[]
const modes = snapshot.modes as ModeDescriptor[]
const scenarios = snapshot.scenarios as ScenarioDescriptor[]
const results = snapshot.results as InteractionFixtureResult[]
const modeColors: Record<ModeId, BenchmarkColor> = {
  'master-static': 'yellow',
  'master-runtime': 'blue',
  'master-progressive': 'green',
  'tailwind-static': 'cyan'
}

function getPrimaryResult() {
  const result = results.find((candidate) => candidate.fixtureId === primaryFixtureId)
  if (!result) throw new Error(`Missing interaction benchmark fixture result: ${primaryFixtureId}`)
  return result
}

function getFixtureName(fixtureId: string) {
  return fixtures.find((fixture) => fixture.id === fixtureId)?.name ?? fixtureId
}

function getModeLabel(modeId: ModeId) {
  return modes.find((mode) => mode.id === modeId)?.label ?? modeId
}

function getScenarioLabel(scenarioId: ScenarioId) {
  return scenarios.find((scenario) => scenario.id === scenarioId)?.label ?? scenarioId
}

function formatMilliseconds(value: number) {
  return `${formatNumber(value, value >= 10 ? 1 : 2)} ms`
}

function formatBytes(bytes: number) {
  return `${formatNumber(bytes / 1000, 1)} kB`
}

function formatCount(value: number) {
  return Math.round(value).toLocaleString('en-US')
}

function formatNumber(value: number, maximumFractionDigits: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits
  }).format(value)
}

function createSummaryMetrics(): BenchmarkMetric[] {
  const variantCount = snapshot.variants.length
  const primaryExisting = getPrimaryResult().scenarios['existing-class-toggle']
  const sampleCount = primaryExisting['master-runtime']?.interaction.readyMs.sampleCount ?? 0
  const progressiveAdoptedCount = results.filter((result) => (
    Object.values(result.scenarios).some((scenarioResults) => (
      scenarioResults['master-progressive']?.correctness.progressiveAdopted.median === 1
    ))
  )).length

  return [
    {
      label: 'Fixtures',
      value: results.length,
      detail: 'dynamic, dashboard, and stress-dom interaction fixtures',
      tone: 'neutral'
    },
    {
      label: 'Variants',
      value: variantCount,
      detail: 'supported fixture, mode, and scenario combinations',
      tone: 'neutral'
    },
    {
      label: 'Browser',
      value: browser ? `${browser.name} ${browser.version}` : 'Chromium',
      detail: 'headless browser used for local trace measurements',
      tone: 'neutral'
    },
    {
      label: 'Samples',
      value: sampleCount,
      detail: 'measured rounds per default interaction variant',
      tone: 'neutral'
    },
    {
      label: 'Progressive adoption',
      value: `${progressiveAdoptedCount}/${results.length}`,
      detail: 'fixtures with at least one adopted progressive interaction variant',
      tone: progressiveAdoptedCount === results.length ? 'good' : 'warn'
    }
  ]
}

function createInteractionReadyItems(scenarioId: ScenarioId, modeIds = modes.map((mode) => mode.id)): BenchmarkBarItem[] {
  const scenarioResults = getPrimaryResult().scenarios[scenarioId]

  return modeIds.flatMap((modeId) => {
    const modeResult = scenarioResults[modeId]
    if (!modeResult) return []
    const metric = modeResult.interaction.readyMs

    return [{
      id: `${primaryFixtureId}-${scenarioId}-${modeId}-ready`,
      label: getModeLabel(modeId),
      value: metric.median,
      valueLabel: formatMilliseconds(metric.median),
      detail: `${formatCount(modeResult.dom.affectedElementCount.median)} elements`,
      color: modeColors[modeId]
    }]
  })
}

function createRuntimeMutationItems(scenarioId: ScenarioId): BenchmarkBarItem[] {
  const scenarioResults = getPrimaryResult().scenarios[scenarioId]

  return (['master-runtime', 'master-progressive'] satisfies ModeId[]).flatMap((modeId) => {
    const modeResult = scenarioResults[modeId]
    if (!modeResult) return []
    const metric = modeResult.interaction.runtimeMutationMs

    return [{
      id: `${primaryFixtureId}-${scenarioId}-${modeId}-runtime-mutation`,
      label: getModeLabel(modeId),
      value: metric.median,
      valueLabel: formatMilliseconds(metric.median),
      detail: `${formatCount(modeResult.interaction.runtimeGeneratedRuleCountDelta.median)} rules`,
      color: modeColors[modeId]
    }]
  })
}

function InteractionChart(props: {
  title: string
  detail: string
  items: BenchmarkBarItem[]
}) {
  return (
    <div className="grid gap:sm">
      <div className="flex items-baseline justify-between gap:md">
        <h4 className="m:0 font-weight:460 font:sm text:strong">{props.title}</h4>
        <span className="font:xs text:muted">{props.detail}</span>
      </div>
      <BenchmarkBars items={props.items} unit="ms" />
    </div>
  )
}

export function InteractionCostSummary() {
  return <BenchmarkMetricTable metrics={createSummaryMetrics()} />
}

export function InteractionPrimaryCharts() {
  return (
    <div className="grid gap:lg">
      <InteractionChart
        title={getScenarioLabel('existing-class-toggle')}
        detail="Mutation-ready median"
        items={createInteractionReadyItems('existing-class-toggle')} />
      <InteractionChart
        title={getScenarioLabel('new-class-toggle')}
        detail="Mutation-ready median"
        items={createInteractionReadyItems('new-class-toggle', ['master-runtime', 'master-progressive'])} />
      <InteractionChart
        title={getScenarioLabel('dom-append-remove')}
        detail="Mutation-ready median"
        items={createInteractionReadyItems('dom-append-remove')} />
    </div>
  )
}

export function InteractionRuntimeCharts() {
  return (
    <div className="grid gap:lg">
      <InteractionChart
        title="Existing class runtime update"
        detail="Runtime mutation median"
        items={createRuntimeMutationItems('existing-class-toggle')} />
      <InteractionChart
        title="New class runtime update"
        detail="Runtime mutation median"
        items={createRuntimeMutationItems('new-class-toggle')} />
      <InteractionChart
        title="Cleanup-cycle runtime update"
        detail="Runtime mutation median"
        items={createRuntimeMutationItems('mutation-cleanup-cycle')} />
    </div>
  )
}

export function InteractionCostTables() {
  return (
    <ExpandContent>
      <div className="doc-table">
        <table>
          <thead>
            <tr>
              <th>Fixture</th>
              <th>Scenario</th>
              <th>Mode</th>
              <th>Ready</th>
              <th>Runtime update</th>
              <th>Rule delta</th>
              <th>Style byte delta</th>
              <th>Style recalc</th>
              <th>Layout</th>
              <th>Paint</th>
              <th>DOM nodes</th>
              <th>Affected</th>
              <th>Computed style</th>
              <th>Cleanup</th>
              <th>Progressive adopted</th>
              <th>Samples</th>
            </tr>
          </thead>
          <tbody>
            {results.flatMap((result) => scenarios.flatMap((scenario) => modes.flatMap((mode) => {
              const value = result.scenarios[scenario.id][mode.id]
              if (!value) return []

              return [(
                <tr key={`${result.fixtureId}-${scenario.id}-${mode.id}`}>
                  <th>{getFixtureName(result.fixtureId)}</th>
                  <td>{scenario.label}</td>
                  <td>{mode.label}</td>
                  <td>{formatMilliseconds(value.interaction.readyMs.median)}</td>
                  <td>{formatMilliseconds(value.interaction.runtimeMutationMs.median)}</td>
                  <td>{formatCount(value.interaction.runtimeGeneratedRuleCountDelta.median)}</td>
                  <td>{formatBytes(value.interaction.runtimeStyleRawBytesDelta.median)}</td>
                  <td>{formatMilliseconds(value.browser.styleRecalculationMs.median)}</td>
                  <td>{formatMilliseconds(value.browser.layoutMs.median)}</td>
                  <td>{formatMilliseconds(value.browser.paintMs.median)}</td>
                  <td>{formatCount(value.dom.nodeCount.median)}</td>
                  <td>{formatCount(value.dom.affectedElementCount.median)}</td>
                  <td>{formatCount(value.correctness.computedStyleValid.median)}</td>
                  <td>{formatCount(value.correctness.cleanupValid.median)}</td>
                  <td>{formatCount(value.correctness.progressiveAdopted.median)}</td>
                  <td>{value.interaction.readyMs.sampleCount}</td>
                </tr>
              )]
            })))}
          </tbody>
        </table>
      </div>
    </ExpandContent>
  )
}
