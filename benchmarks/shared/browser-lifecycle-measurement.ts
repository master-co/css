import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import type { Browser, BrowserContext, CDPSession, Page } from '@playwright/test'
import { benchmarkRoot, measureRelativeArtifact, resetDirectory } from './runner'
import { collectConsoleWarnings, createEmptyActionResult, createLifecycleMetricSamples, createLifecycleTraceArtifact, omitRuntimeStyleText, readJSHeapUsedBytes, readLifecycleState, readRuntimeMetrics, summarizeTraceEvents, waitForBenchmarkReady, assertLifecycleCorrect } from './browser-lifecycle-samples'
import { startBrowserLifecycleServer } from './browser-lifecycle-server'
import type { BrowserLifecycleMeasurement, BrowserLifecycleTraceArtifactMode, BrowserLifecycleVariant, ChromeTraceEvent, LifecycleActionResult, LifecycleMeasurementValues, LifecycleStateWithRuntimeStyle, LifecycleTraceActionResult } from './browser-lifecycle'

const fixedViewport = { width: 1280, height: 720 }

export async function measureBrowserLifecycle(options: {
  browser: Browser
  pageRoot: string
  variant: BrowserLifecycleVariant
  round: number
  roundLabel: string
  timeoutMs: number
  traceArtifactMode: BrowserLifecycleTraceArtifactMode
  collectArtifacts: boolean
}): Promise<BrowserLifecycleMeasurement> {
  const server = await startBrowserLifecycleServer(options.pageRoot)

  try {
    const context = await options.browser.newContext({
      viewport: fixedViewport,
      deviceScaleFactor: 1
    })

    try {
      return await withLifecycleMeasurementTimeout(options, context, async () => {
        const page = await context.newPage()
        const consoleWarnings = collectConsoleWarnings(page)
        const measurement = options.variant.scenarioId === 'initial-load'
          ? await measureLifecycleNavigation(page, server.origin)
          : await measureLifecycleInteraction(page, server.origin)

        if (!options.collectArtifacts) {
          return {
            samples: createLifecycleMetricSamples(options.variant.id, options.round, measurement.values),
            artifacts: []
          }
        }

        const artifactRoot = resolve(benchmarkRoot, '.results', 'browser-lifecycle', 'artifacts', options.variant.id, `round-${options.round}`)
        await resetDirectory(artifactRoot)

        const traceFile = resolve(artifactRoot, 'trace.json')
        const diagnosticsFile = resolve(artifactRoot, 'diagnostics.json')
        const screenshotFile = resolve(artifactRoot, 'screenshot.png')
        const runtimeStyleFile = resolve(artifactRoot, 'runtime-style.css')
        const traceArtifact = createLifecycleTraceArtifact(measurement.events, measurement.values, options.traceArtifactMode)
        if (traceArtifact.content) await writeFile(traceFile, `${traceArtifact.content}\n`)
        await page.screenshot({ path: screenshotFile, fullPage: false })

        const diagnostics = {
          variant: options.variant,
          values: measurement.values,
          state: measurement.state,
          action: measurement.action,
          traceArtifactMode: traceArtifact.mode,
          traceEventCount: traceArtifact.eventCount,
          retainedTraceEventCount: traceArtifact.retainedEventCount,
          consoleWarnings,
          runtimeStyleArtifact: measurement.runtimeStyleText ? 'runtime-style.css' : undefined
        }
        await writeFile(diagnosticsFile, `${JSON.stringify(diagnostics, null, 2)}\n`)
        if (measurement.runtimeStyleText) await writeFile(runtimeStyleFile, measurement.runtimeStyleText)

        const artifactFiles = [diagnosticsFile, screenshotFile]
        if (traceArtifact.content) artifactFiles.unshift(traceFile)
        if (measurement.runtimeStyleText) artifactFiles.push(runtimeStyleFile)

        return {
          samples: createLifecycleMetricSamples(options.variant.id, options.round, measurement.values),
          artifacts: await Promise.all(artifactFiles.map((file) => measureRelativeArtifact(file)))
        }
      })
    } finally {
      await context.close()
    }
  } finally {
    await server.close()
  }
}

async function withLifecycleMeasurementTimeout<T>(
  options: {
    variant: BrowserLifecycleVariant
    roundLabel: string
    timeoutMs: number
  },
  context: BrowserContext,
  action: () => Promise<T>
): Promise<T> {
  const timeoutMs = options.timeoutMs
  let timeout: NodeJS.Timeout | undefined
  let timedOut = false

  try {
    const actionPromise = action()
    return await new Promise<T>((resolvePromise, rejectPromise) => {
      timeout = setTimeout(() => {
        timedOut = true
        void context.close().catch(() => undefined)
        rejectPromise(new Error([
          `Browser lifecycle measurement timed out for ${options.variant.id}.`,
          `Scenario: ${options.variant.scenarioId}.`,
          `Round: ${options.roundLabel}.`,
          `Timeout: ${timeoutMs}ms.`
        ].join(' ')))
      }, timeoutMs)

      actionPromise.then(
        (value) => {
          if (!timedOut) resolvePromise(value)
        },
        (error) => {
          if (!timedOut) rejectPromise(error)
        }
      )
    })
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

async function measureLifecycleNavigation(page: Page, url: string) {
  const result = await tracePage(page, async (client) => {
    const startedAt = performance.now()
    await page.goto(url, { waitUntil: 'load' })
    await waitForBenchmarkReady(page)
    await assertLifecycleCorrect(page)
    const state = await readLifecycleState(page)
    const runtimeMetrics = await readRuntimeMetrics(page)
    const heapUsedBytes = await readJSHeapUsedBytes(client)
    const navigationReadyMs = performance.now() - startedAt

    return {
      navigationReadyMs,
      state,
      action: createEmptyActionResult(),
      runtimeMetrics,
      heapUsedBytes
    }
  })

  return createMeasuredResult(result)
}

async function measureLifecycleInteraction(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'load' })
  await waitForBenchmarkReady(page)
  await assertLifecycleCorrect(page)

  const result = await tracePage(page, async (client) => {
    const startedAt = performance.now()
    const action = await page.evaluate(() => globalThis.__runLifecycleScenario())
    const state = await readLifecycleState(page)
    const runtimeMetrics = await readRuntimeMetrics(page)
    const heapUsedBytes = await readJSHeapUsedBytes(client)
    const navigationReadyMs = performance.now() - startedAt

    return {
      navigationReadyMs,
      state,
      action,
      runtimeMetrics,
      heapUsedBytes
    }
  })

  return createMeasuredResult(result)
}

async function tracePage(page: Page, action: (client: CDPSession) => Promise<LifecycleTraceActionResult>) {
  const context = page.context()
  const client = await context.newCDPSession(page)
  const events: ChromeTraceEvent[] = []
  const tracingComplete = new Promise<void>((resolveComplete) => {
    client.once('Tracing.tracingComplete', () => resolveComplete())
  })

  client.on('Tracing.dataCollected', (event: { value?: ChromeTraceEvent[] }) => {
    if (event.value) events.push(...event.value)
  })

  await client.send('Performance.enable').catch(() => undefined)
  await client.send('Tracing.start', {
    categories: [
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'blink',
      'loading'
    ].join(','),
    transferMode: 'ReportEvents'
  })

  try {
    const actionResult = await action(client)
    await client.send('Tracing.end')
    await tracingComplete

    return {
      ...actionResult,
      events
    }
  } finally {
    await client.detach().catch(() => undefined)
  }
}

function createMeasuredResult(result: {
  events: ChromeTraceEvent[]
  navigationReadyMs: number
  state: LifecycleStateWithRuntimeStyle
  action: LifecycleActionResult
  runtimeMetrics: {
    runtimeReadyMs: number
    runtimeBootstrapMs: number
    runtimeObserveMs: number
  }
  heapUsedBytes: number
}) {
  const traceMetrics = summarizeTraceEvents(result.events)
  const values: LifecycleMeasurementValues = {
    navigationReadyMs: result.navigationReadyMs,
    stylesheetParseMs: traceMetrics.stylesheetParseMs,
    styleRecalculationMs: traceMetrics.styleRecalculationMs,
    styleRecalculationCount: traceMetrics.styleRecalculationCount,
    layoutMs: traceMetrics.layoutMs,
    paintMs: traceMetrics.paintMs,
    longTaskCount: traceMetrics.longTaskCount,
    fcpMs: result.state.fcpMs,
    lcpMs: result.state.lcpMs,
    inpStyleInteractionMs: result.action.elapsedMs,
    jsHeapUsedBytes: result.heapUsedBytes,
    domNodeCount: result.state.domNodeCount,
    affectedElementCount: result.action.affectedElementCount,
    averageClassCount: result.state.averageClassCount,
    cssomRuleCount: result.state.cssomRuleCount,
    runtimeReadyMs: result.runtimeMetrics.runtimeReadyMs,
    runtimeBootstrapMs: result.runtimeMetrics.runtimeBootstrapMs,
    runtimeObserveMs: result.runtimeMetrics.runtimeObserveMs,
    runtimeMutationMs: result.action.runtimeMutationMs,
    runtimeGeneratedRuleCount: result.state.runtimeGeneratedRuleCount,
    runtimeGeneratedRuleCountDelta: result.action.runtimeGeneratedRuleCountDelta,
    runtimeStyleRawBytes: result.state.runtimeStyleRawBytes,
    runtimeStyleRawBytesDelta: result.action.runtimeStyleRawBytesDelta,
    retainedClassCount: result.state.retainedClassCount,
    retainedRuleCount: result.state.retainedRuleCount,
    mutationObserverCallbackCount: result.action.mutationObserverCallbackCount,
    mutationObserverCallbackDurationMs: result.action.mutationObserverCallbackDurationMs,
    routeCount: result.action.routeCount,
    progressiveAdopted: result.state.progressiveAdopted,
    computedStyleValid: result.action.computedStyleValid
  }

  return {
    events: result.events,
    values,
    state: omitRuntimeStyleText(result.state),
    action: result.action,
    runtimeStyleText: result.state.runtimeStyleText || ''
  }
}
