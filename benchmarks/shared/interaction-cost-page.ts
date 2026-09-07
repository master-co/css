import type { BenchmarkFixtureId } from './types'
import type { InteractionClassModel, InteractionModeId, InteractionScenarioId, RuntimeMutationStrategyId } from './interaction-cost-config'

export function renderInteractionDocument(options: {
  fixtureId: BenchmarkFixtureId
  modeId: InteractionModeId
  scenarioId: InteractionScenarioId
  classes: InteractionClassModel
  includeStaticClassSource: boolean
  runtimeMutationStrategy?: RuntimeMutationStrategyId
  postInteractionSettleFrames?: number
}) {
  const fixture = getInteractionFixtureShape(options.fixtureId)
  const staticClassSource = options.includeStaticClassSource
    ? renderStaticClassSource(options.classes)
    : ''
  const items = renderInteractionItems(options.classes, fixture.itemCount)

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '    <meta charset="utf-8">',
    '    <meta name="viewport" content="width=device-width, initial-scale=1">',
    `    <title>${escapeHTML(fixture.label)} interaction benchmark</title>`,
    '</head>',
    `<body class="${classAttribute(options.classes.body)}">`,
    '    <span id="interaction-style-probe" class="text-center" hidden>style probe</span>',
    '    <div id="benchmark-loaded" hidden>loaded</div>',
    `    <main class="${classAttribute(options.classes.shell)}">`,
    `        <header class="${classAttribute(options.classes.header)}">`,
    `            <h1 class="${classAttribute(options.classes.title)}">${escapeHTML(fixture.label)} interaction fixture</h1>`,
    `            <p class="${classAttribute(options.classes.subtitle)}">${escapeHTML(fixture.description)}</p>`,
    '        </header>',
    `        <section class="${classAttribute(options.classes.panel)}">`,
    `            <button class="${classAttribute(options.classes.button)}" type="button">Action</button>`,
    '            <div id="interaction-scratch"></div>',
    '        </section>',
    `        <section class="interaction-grid ${classAttribute(options.classes.grid)}" data-fixture="${options.fixtureId}">`,
    items,
    '        </section>',
    staticClassSource,
    '    </main>',
    renderInteractionScript({
      fixtureId: options.fixtureId,
      modeId: options.modeId,
      scenarioId: options.scenarioId,
      classes: options.classes,
      affectedCount: fixture.affectedCount,
      appendCount: fixture.appendCount,
      cleanupCycles: fixture.cleanupCycles,
      runtimeMutationStrategy: options.runtimeMutationStrategy,
      postInteractionSettleFrames: options.postInteractionSettleFrames
    }),
    '</body>',
    '</html>'
  ].join('\n')
}

function getInteractionFixtureShape(fixtureId: BenchmarkFixtureId) {
  switch (fixtureId) {
    case 'dynamic':
      return {
        label: 'Dynamic',
        description: 'Primary fixture for class toggles, runtime rule generation, and mutation cleanup.',
        itemCount: 96,
        affectedCount: 64,
        appendCount: 48,
        cleanupCycles: 4
      }
    case 'dashboard':
      return {
        label: 'Dashboard',
        description: 'Repeated realistic components used as an application-control interaction fixture.',
        itemCount: 320,
        affectedCount: 160,
        appendCount: 80,
        cleanupCycles: 3
      }
    case 'stress-dom':
      return {
        label: 'Stress DOM',
        description: 'Large DOM control with fixed CSS to isolate mutation and recalculation sensitivity.',
        itemCount: 1200,
        affectedCount: 600,
        appendCount: 160,
        cleanupCycles: 3
      }
    default:
      throw new Error(`Interaction benchmark fixture is not implemented: ${fixtureId}`)
  }
}

function classAttribute(classes: string[]) {
  return escapeAttribute(unique(classes).join(' '))
}

function getAllInteractionClasses(classes: InteractionClassModel) {
  return unique([
    'text-center',
    ...classes.body,
    ...classes.shell,
    ...classes.header,
    ...classes.title,
    ...classes.subtitle,
    ...classes.grid,
    ...classes.itemBase,
    ...classes.itemLight,
    ...classes.itemActive,
    ...classes.itemDark,
    ...classes.itemNew,
    ...classes.itemTemp,
    ...classes.itemTitle,
    ...classes.itemMeta,
    ...classes.panel,
    ...classes.button
  ])
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function escapeHTML(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function escapeAttribute(value: string) {
  return escapeHTML(value)
    .replaceAll('"', '&quot;')
}

function renderInteractionItems(classes: InteractionClassModel, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const stateClasses = index % 3 === 0 ? classes.itemActive : classes.itemLight
    return [
      `            <article class="${classAttribute([...classes.itemBase, ...stateClasses])}" data-index="${index}">`,
      `                <strong class="${classAttribute(classes.itemTitle)}">Item ${index + 1}</strong>`,
      `                <span class="${classAttribute(classes.itemMeta)}">${index % 3 === 0 ? 'Active' : 'Idle'}</span>`,
      '            </article>'
    ].join('\n')
  }).join('\n')
}

function renderStaticClassSource(classes: InteractionClassModel) {
  return `        <div style="display:none" aria-hidden="true" class="${classAttribute(getAllInteractionClasses(classes))}"></div>`
}

function renderInteractionScript(options: {
  fixtureId: BenchmarkFixtureId
  modeId: InteractionModeId
  scenarioId: InteractionScenarioId
  classes: InteractionClassModel
  affectedCount: number
  appendCount: number
  cleanupCycles: number
  runtimeMutationStrategy?: RuntimeMutationStrategyId
  postInteractionSettleFrames?: number
}) {
  const config = JSON.stringify({
    fixtureId: options.fixtureId,
    modeId: options.modeId,
    scenarioId: options.scenarioId,
    affectedCount: options.affectedCount,
    appendCount: options.appendCount,
    cleanupCycles: options.cleanupCycles,
    postInteractionSettleFrames: options.postInteractionSettleFrames ?? 3,
    runtimeMutationStrategy: options.runtimeMutationStrategy || 'baseline',
    classes: {
      itemBase: options.classes.itemBase,
      light: options.classes.itemLight,
      active: options.classes.itemActive,
      dark: options.classes.itemDark,
      newRule: options.classes.itemNew,
      temp: options.classes.itemTemp,
      itemTitle: options.classes.itemTitle,
      itemMeta: options.classes.itemMeta
    }
  })

  return [
    '    <script>',
    `        window.__interactionConfig = ${config};`,
    '        window.__runInteractionScenario = async function() {',
    '            const config = window.__interactionConfig;',
    '            const metrics = window.__interactionMetrics || { runtimeMutationMs: 0, collectInteractionMutations: false };',
    '            metrics.runtimeMutationMs = 0;',
    '            if (metrics.runtimeDiagnosticsEnabled) resetRuntimeMutationDiagnostics(metrics);',
    '            const before = readRuntimeState();',
    '            const startedAt = performance.now();',
    '            metrics.collectInteractionMutations = true;',
    '            let scenarioDetails = {};',
    '            if (config.scenarioId === "existing-class-toggle") scenarioDetails = runExistingClassToggle(config);',
    '            if (config.scenarioId === "new-class-toggle") scenarioDetails = runNewClassToggle(config);',
    '            if (config.scenarioId === "dom-append-remove") scenarioDetails = runAppendRemove(config);',
    '            if (config.scenarioId === "theme-switch") scenarioDetails = runThemeSwitch(config);',
    '            if (config.scenarioId === "mutation-cleanup-cycle") scenarioDetails = await runCleanupCycle(config);',
    '            await waitPostInteractionSettleFrames(config.postInteractionSettleFrames);',
    '            const strategyFlushResult = flushDeferredRuntimeRemovalsBeforeResult();',
    '            if (config.scenarioId === "mutation-cleanup-cycle") scenarioDetails = finalizeCleanupCycleDetails(config, scenarioDetails, strategyFlushResult);',
    '            scenarioDetails = finalizeScenarioDetails(config, scenarioDetails);',
    '            metrics.collectInteractionMutations = false;',
    '            const after = readRuntimeState();',
    '            return createInteractionResult({',
    '                before,',
    '                after,',
    '                elapsedMs: performance.now() - startedAt,',
    '                runtimeMutationMs: metrics.runtimeMutationMs || 0,',
    '                scenarioDetails',
    '            });',
    '        };',
    '        window.__readInteractionState = readRuntimeState;',
    '        window.__readRuntimeMutationDiagnostics = readRuntimeMutationDiagnostics;',
    '        window.__waitInteractionFrames = waitFrames;',
    '        window.__finishViewportInteraction = function(input) {',
    '            const after = readRuntimeState();',
    '            return createInteractionResult({',
    '                before: input.before,',
    '                after,',
    '                elapsedMs: input.elapsedMs,',
    '                runtimeMutationMs: 0,',
    '                scenarioDetails: {',
    '                    affectedElementCount: countAffectedItems(),',
    '                    computedStyleValid: input.beforeWidth !== input.resizedWidth,',
    '                    cleanupValid: true,',
    '                    beforeWidth: input.beforeWidth,',
    '                    resizedWidth: input.resizedWidth',
    '                }',
    '            });',
    '        };',
    '        function runExistingClassToggle(config) {',
    '            const items = getAffectedItems(config.affectedCount);',
    '            const target = items[1] || items[0];',
    '            const beforeColor = getComputedStyle(target).backgroundColor;',
    '            for (const item of items) {',
    '                if (hasEveryClass(item, config.classes.active)) {',
    '                    removeClasses(item, config.classes.active);',
    '                    addClasses(item, config.classes.light);',
    '                } else {',
    '                    removeClasses(item, config.classes.light);',
    '                    addClasses(item, config.classes.active);',
    '                }',
    '            }',
    '            const afterColor = getComputedStyle(target).backgroundColor;',
    '            return {',
    '                affectedElementCount: items.length,',
    '                computedStyleValid: beforeColor !== afterColor,',
    '                cleanupValid: true,',
    '                beforeColor,',
    '                afterColor,',
    '                targetIndex: Number(target.dataset.index || 0),',
    '                validation: "backgroundColor"',
    '            };',
    '        }',
    '        function runNewClassToggle(config) {',
    '            const items = getAffectedItems(config.affectedCount);',
    '            const target = items[0];',
    '            const beforeOutlineStyle = getComputedStyle(target).outlineStyle;',
    '            const beforeOutlineWidth = getComputedStyle(target).outlineWidth;',
    '            for (const item of items) addClasses(item, config.classes.newRule);',
    '            return {',
    '                affectedElementCount: items.length,',
    '                computedStyleValid: false,',
    '                cleanupValid: true,',
    '                beforeOutlineStyle,',
    '                beforeOutlineWidth,',
    '                targetIndex: Number(target.dataset.index || 0),',
    '                validation: "outline"',
    '            };',
    '        }',
    '        function runAppendRemove(config) {',
    '            const scratch = getScratch();',
    '            scratch.textContent = "";',
    '            for (let index = 0; index < config.appendCount; index++) {',
    '                scratch.appendChild(createInteractionItem(config, index));',
    '            }',
    '            const appendedCount = scratch.children.length;',
    '            scratch.textContent = "";',
    '            return {',
    '                affectedElementCount: config.appendCount,',
    '                computedStyleValid: appendedCount === config.appendCount,',
    '                cleanupValid: scratch.children.length === 0,',
    '                appendedCount',
    '            };',
    '        }',
    '        function runThemeSwitch(config) {',
    '            const items = getAffectedItems(config.affectedCount);',
    '            const target = items[0];',
    '            const beforeColor = getComputedStyle(target).backgroundColor;',
    '            for (const item of items) {',
    '                removeClasses(item, config.classes.light);',
    '                removeClasses(item, config.classes.active);',
    '                addClasses(item, config.classes.dark);',
    '            }',
    '            const afterColor = getComputedStyle(target).backgroundColor;',
    '            document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";',
    '            return {',
    '                affectedElementCount: items.length,',
    '                computedStyleValid: beforeColor !== afterColor,',
    '                cleanupValid: true,',
    '                beforeColor,',
    '                afterColor,',
    '                targetIndex: Number(target.dataset.index || 0),',
    '                validation: "backgroundColor"',
    '            };',
    '        }',
    '        async function runCleanupCycle(config) {',
    '            const scratch = getScratch();',
    '            scratch.textContent = "";',
    '            for (let cycle = 0; cycle < config.cleanupCycles; cycle++) {',
    '                for (let index = 0; index < config.appendCount; index++) {',
    '                    scratch.appendChild(createInteractionItem(config, index, config.classes.temp));',
    '                }',
    '                await waitFrames(1);',
    '                scratch.textContent = "";',
    '                await waitFrames(1);',
    '            }',
    '            const state = readRuntimeState();',
    '            const tempClassNames = config.classes.temp;',
    '            const runtimeClean = !state.runtimeAvailable || tempClassNames.every((className) => !state.classCounts[className]);',
    '            const cleanupValid = scratch.children.length === 0 && runtimeClean;',
    '            return {',
    '                affectedElementCount: config.appendCount * config.cleanupCycles,',
    '                mutationCycleCount: config.cleanupCycles,',
    '                appendCount: config.appendCount,',
    '                removedNodeCount: config.appendCount * config.cleanupCycles,',
    '                computedStyleValid: true,',
    '                cleanupValid,',
    '                cleanupValidDuringTrace: cleanupValid,',
    '                cleanupValidAfterFlush: cleanupValid,',
    '                runtimeClean,',
    '                runtimeCleanDuringTrace: runtimeClean,',
    '                runtimeCleanAfterFlush: runtimeClean',
    '            };',
    '        }',
    '        function createInteractionItem(config, index, extraClasses) {',
    '            const item = document.createElement("article");',
    '            addClasses(item, config.classes.itemBase);',
    '            addClasses(item, config.classes.light);',
    '            if (extraClasses) addClasses(item, extraClasses);',
    '            item.dataset.appended = String(index);',
    '            const title = document.createElement("strong");',
    '            addClasses(title, config.classes.itemTitle);',
    '            title.textContent = `Appended ${index + 1}`;',
    '            const meta = document.createElement("span");',
    '            addClasses(meta, config.classes.itemMeta);',
    '            meta.textContent = "Inserted";',
    '            item.append(title, meta);',
    '            return item;',
    '        }',
    '        function createInteractionResult(input) {',
    '            const details = input.scenarioDetails || {};',
    '            const after = input.after;',
    '            return {',
    '                elapsedMs: input.elapsedMs,',
    '                runtimeMutationMs: input.runtimeMutationMs,',
    '                runtimeGeneratedRuleCountDelta: after.runtimeGeneratedRuleCount - input.before.runtimeGeneratedRuleCount,',
    '                runtimeStyleRawBytesDelta: after.runtimeStyleRawBytes - input.before.runtimeStyleRawBytes,',
    '                domNodeCount: after.domNodeCount,',
    '                affectedElementCount: details.affectedElementCount || countAffectedItems(),',
    '                computedStyleValid: details.computedStyleValid ? 1 : 0,',
    '                cleanupValid: details.cleanupValid ? 1 : 0,',
    '                progressiveAdopted: after.progressiveAdopted,',
    '                runtimeStyleText: after.runtimeStyleText,',
    '                details',
    '            };',
    '        }',
    '        function finalizeScenarioDetails(config, details) {',
    '            if (!details || !details.validation) return details || {};',
    '            const target = document.querySelector(`[data-index="${details.targetIndex}"]`);',
    '            if (!target) return { ...details, computedStyleValid: false, missingTarget: true };',
    '            const style = getComputedStyle(target);',
    '            if (details.validation === "backgroundColor") {',
    '                const afterColor = style.backgroundColor;',
    '                return { ...details, afterColor, computedStyleValid: details.beforeColor !== afterColor };',
    '            }',
    '            if (details.validation === "outline") {',
    '                const afterOutlineStyle = style.outlineStyle;',
    '                const afterOutlineWidth = style.outlineWidth;',
    '                return {',
    '                    ...details,',
    '                    afterOutlineStyle,',
    '                    afterOutlineWidth,',
    '                    computedStyleValid: afterOutlineStyle !== "none" && afterOutlineWidth !== "0px"',
    '                };',
    '            }',
    '            return details;',
    '        }',
    '        function finalizeCleanupCycleDetails(config, details, strategyFlushResult) {',
    '            const state = readRuntimeState();',
    '            const tempClassNames = config.classes.temp;',
    '            const runtimeCleanAfterFlush = !state.runtimeAvailable || tempClassNames.every((className) => !state.classCounts[className]);',
    '            const cleanupValidAfterFlush = getScratch().children.length === 0 && runtimeCleanAfterFlush;',
    '            return {',
    '                ...details,',
    '                cleanupValid: cleanupValidAfterFlush,',
    '                cleanupValidAfterFlush,',
    '                runtimeCleanAfterFlush,',
    '                strategyFlushResult: strategyFlushResult || null',
    '            };',
    '        }',
    '        function flushDeferredRuntimeRemovalsBeforeResult() {',
    '            const metrics = window.__interactionMetrics;',
    '            if (metrics?.runtimeMutationStrategyId !== "defer-remove") return null;',
    '            if (typeof window.__flushRuntimeMutationStrategy !== "function") return null;',
    '            return window.__flushRuntimeMutationStrategy("before-result");',
    '        }',
    '        function readRuntimeState() {',
    '            const runtime = globalThis.masterCSSRuntime;',
    '            const runtimeStyleText = runtime?.style?.textContent || runtime?.text || "";',
    '            const retainedClassNames = [...(runtime?.retainedClassNames || [])].map(String);',
    '            const retainedRuleState = readRetainedRuleState(runtime, retainedClassNames);',
    '            return {',
    '                runtimeAvailable: Boolean(runtime),',
    '                progressiveAdopted: runtime?.progressive ? 1 : 0,',
    '                runtimeGeneratedRuleCount: runtime?.classUtilities?.size || countCSSRules(runtime?.style?.sheet?.cssRules),',
    '                runtimeStyleRawBytes: new TextEncoder().encode(runtimeStyleText).length,',
    '                runtimeStyleText,',
    '                classCounts: Object.fromEntries(runtime?.classCounts || []),',
    '                classUtilityNames: [...(runtime?.classUtilities?.keys?.() || [])].map(String),',
    '                retainedClassNames,',
    '                retainedClassRuleCount: retainedRuleState.retainedClassRuleCount,',
    '                retainedClassRawBytes: retainedRuleState.retainedClassRawBytes,',
    '                domNodeCount: document.getElementsByTagName("*").length',
    '            };',
    '        }',
    '        function readRetainedRuleState(runtime, retainedClassNames) {',
    '            let retainedClassRuleCount = 0;',
    '            let retainedClassRawBytes = 0;',
    '            for (const className of retainedClassNames) {',
    '                const rules = runtime?.classUtilities?.get?.(className) || [];',
    '                for (const rule of rules) {',
    '                    const nodes = Array.isArray(rule?.nodes) ? rule.nodes : null;',
    '                    if (nodes?.length) {',
    '                        retainedClassRuleCount += nodes.length;',
    '                        for (const node of nodes) retainedClassRawBytes += new TextEncoder().encode(node.text || "").length;',
    '                    } else {',
    '                        retainedClassRuleCount++;',
    '                        retainedClassRawBytes += new TextEncoder().encode(rule?.text || "").length;',
    '                    }',
    '                }',
    '            }',
    '            return { retainedClassRuleCount, retainedClassRawBytes };',
    '        }',
    '        function readRuntimeMutationDiagnostics() {',
    '            const metrics = window.__interactionMetrics || {};',
    '            return {',
    '                mutationObserverCallbackCount: metrics.mutationObserverCallbackCount || 0,',
    '                mutationObserverCallbackDurationMs: metrics.mutationObserverCallbackDurationMs || 0,',
    '                mutationRecordCount: metrics.mutationRecordCount || 0,',
    '                mutationAddedNodeCount: metrics.mutationAddedNodeCount || 0,',
    '                mutationRemovedNodeCount: metrics.mutationRemovedNodeCount || 0,',
    '                mutationClassAttributeCount: metrics.mutationClassAttributeCount || 0,',
    '                runtimeAddCallCount: metrics.runtimeAddCallCount || 0,',
    '                runtimeRemoveCallCount: metrics.runtimeRemoveCallCount || 0,',
    '                runtimeAddClassCount: metrics.runtimeAddClassCount || 0,',
    '                runtimeRemoveClassCount: metrics.runtimeRemoveClassCount || 0,',
    '                runtimeAddDurationMs: metrics.runtimeAddDurationMs || 0,',
    '                runtimeRemoveDurationMs: metrics.runtimeRemoveDurationMs || 0,',
    '                runtimeDeferredRemoveCallCount: metrics.runtimeDeferredRemoveCallCount || 0,',
    '                runtimeDeferredRemoveClassCount: metrics.runtimeDeferredRemoveClassCount || 0,',
    '                runtimeSuppressedRemoveCallCount: metrics.runtimeSuppressedRemoveCallCount || 0,',
    '                runtimeSuppressedRemoveClassCount: metrics.runtimeSuppressedRemoveClassCount || 0,',
    '                runtimeFlushRemoveCallCount: metrics.runtimeFlushRemoveCallCount || 0,',
    '                runtimeFlushRemoveClassCount: metrics.runtimeFlushRemoveClassCount || 0,',
    '                runtimeFlushRemoveDurationMs: metrics.runtimeFlushRemoveDurationMs || 0,',
    '                runtimeQueuedRemoveClassCount: metrics.runtimeQueuedRemoveClassCount || 0',
    '            };',
    '        }',
    '        function countCSSRules(rules) {',
    '            if (!rules) return 0;',
    '            let total = 0;',
    '            for (const rule of rules) total += "cssRules" in rule ? countCSSRules(rule.cssRules) : 1;',
    '            return total;',
    '        }',
    '        function getAffectedItems(count) { return Array.from(document.querySelectorAll(".interaction-item")).slice(0, count); }',
    '        function countAffectedItems() { return getAffectedItems(window.__interactionConfig.affectedCount).length; }',
    '        function getScratch() { return document.getElementById("interaction-scratch"); }',
    '        function hasEveryClass(element, classes) { return classes.every((className) => element.classList.contains(className)); }',
    '        function addClasses(element, classes) { if (classes.length) element.classList.add(...classes); }',
    '        function removeClasses(element, classes) { if (classes.length) element.classList.remove(...classes); }',
    '        function waitPostInteractionSettleFrames(count) {',
    '            const frameCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 3;',
    '            return frameCount > 0 ? waitFrames(frameCount) : Promise.resolve();',
    '        }',
    '        function waitFrames(count) {',
    '            return new Promise((resolve) => {',
    '                const step = () => {',
    '                    if (count <= 0) { resolve(); return; }',
    '                    count--;',
    '                    requestAnimationFrame(step);',
    '                };',
    '                requestAnimationFrame(step);',
    '            });',
    '        }',
    '    </script>'
  ].join('\n')
}
