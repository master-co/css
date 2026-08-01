import type { BrowserLifecycleModeId, BrowserLifecycleVariantSpec, LifecycleClassModel } from './browser-lifecycle'

export function renderLifecycleDocument(options: {
  spec: BrowserLifecycleVariantSpec
  modeId: BrowserLifecycleModeId
  classes: LifecycleClassModel
  longSessionMs: number
  includeStaticClassSource: boolean
}) {
  const itemCount = getInitialItemCount(options.spec)
  const items = renderLifecycleItems(options.classes, itemCount)
  const staticClassSource = options.includeStaticClassSource
    ? renderStaticClassSource(options.classes)
    : ''

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '    <meta charset="utf-8">',
    '    <meta name="viewport" content="width=device-width, initial-scale=1">',
    `    <title>${escapeHTML(options.spec.detailLabel)} lifecycle benchmark</title>`,
    renderLifecycleHeadStyle(),
    renderLifecycleMetricsScript({ autoReady: options.modeId === 'master-static' || options.modeId === 'tailwind-static' }),
    '</head>',
    `<body class="${classAttribute(options.classes.body)}">`,
    '    <span id="benchmark-style-probe" class="text-center" hidden>style probe</span>',
    '    <div id="benchmark-loaded" hidden>loaded</div>',
    `    <main class="${classAttribute(options.classes.shell)}">`,
    `        <header class="${classAttribute(options.classes.header)}">`,
    `            <h1 class="${classAttribute(options.classes.title)}">${escapeHTML(options.spec.detailLabel)}</h1>`,
    `            <p class="${classAttribute(options.classes.subtitle)}">Browser lifecycle fixture for ${escapeHTML(options.spec.scenarioId)}.</p>`,
    '        </header>',
    `        <section class="${classAttribute(options.classes.panel)}">`,
    `            <button class="${classAttribute(options.classes.button)}" type="button">Action</button>`,
    '            <div id="lifecycle-scratch"></div>',
    '        </section>',
    `        <section id="lifecycle-route" class="${classAttribute(options.classes.routeShell)}">`,
    `            <div class="${classAttribute(options.classes.routeHero)}">`,
    '                <strong>Lifecycle route</strong>',
    '                <p>Initial route content used before route-navigation scenarios.</p>',
    '            </div>',
    `            <section id="lifecycle-grid" class="${classAttribute(options.classes.grid)}">`,
    items,
    '            </section>',
    '        </section>',
    staticClassSource,
    '    </main>',
    renderLifecycleScenarioScript({
      spec: options.spec,
      classes: options.classes,
      longSessionMs: options.longSessionMs
    }),
    '</body>',
    '</html>'
  ].join('\n')
}

function renderLifecycleHeadStyle() {
  return [
    '    <style>',
    '        :root { --lifecycle-card-bg: #ffffff; --lifecycle-card-fg: #1e293b; }',
    '        :root[data-theme="dark"] { --lifecycle-card-bg: #0f172a; --lifecycle-card-fg: #ffffff; }',
    '        :root[data-theme="dark"] .lifecycle-data-card { background: #0f172a; color: #ffffff; }',
    '        .lifecycle-variable-card { background: var(--lifecycle-card-bg); color: var(--lifecycle-card-fg); }',
    '    </style>'
  ].join('\n')
}

function renderLifecycleMetricsScript(options: { autoReady: boolean }) {
  return [
    '    <script>',
    '        window.__benchmarkReady = false;',
    '        window.__lifecycleMetrics = {',
    '            runtimeScriptLoadedMs: 0,',
    '            runtimeReadyMs: 0,',
    '            runtimeBootstrapMs: 0,',
    '            runtimeObserveMs: 0,',
    '            progressiveAdopted: 0,',
    '            runtimeMutationMs: 0,',
    '            collectMutations: false,',
    '            mutationObserverCallbackCount: 0,',
    '            mutationObserverCallbackDurationMs: 0,',
    '            lcpMs: 0',
    '        };',
    '        try {',
    '            new PerformanceObserver((list) => {',
    '                const entries = list.getEntries();',
    '                const last = entries[entries.length - 1];',
    '                if (last) window.__lifecycleMetrics.lcpMs = last.startTime;',
    '            }).observe({ type: "largest-contentful-paint", buffered: true });',
    '        } catch {}',
    '        window.__markLifecycleReady = function() {',
    '            requestAnimationFrame(() => requestAnimationFrame(() => {',
    '                const marker = document.getElementById("benchmark-loaded");',
    '                if (marker) marker.dataset.ready = "true";',
    '                document.documentElement.dataset.benchmarkReady = "true";',
    '                document.documentElement.removeAttribute("hidden");',
    '                window.__benchmarkReady = true;',
    '            }));',
    '        };',
    options.autoReady ? '        window.addEventListener("load", () => window.__markLifecycleReady());' : '',
    '    </script>'
  ].filter(Boolean).join('\n')
}

function renderLifecycleScenarioScript(options: {
  spec: BrowserLifecycleVariantSpec
  classes: LifecycleClassModel
  longSessionMs: number
}) {
  const config = JSON.stringify({
    scenarioId: options.spec.scenarioId,
    detailId: options.spec.detailId,
    appendCount: options.spec.appendCount || 0,
    appendRuleState: options.spec.appendRuleState || 'existing-rule',
    toggleRounds: options.spec.toggleRounds || 6,
    themeModel: options.spec.themeModel || 'class-swap',
    longSessionMs: options.spec.longSessionMs || options.longSessionMs,
    classes: {
      cardBase: options.classes.cardBase,
      cardLight: options.classes.cardLight,
      cardActive: options.classes.cardActive,
      cardSelected: options.classes.cardSelected,
      cardExpanded: options.classes.cardExpanded,
      cardDark: options.classes.cardDark,
      cardNew: options.classes.cardNew,
      cardTitle: options.classes.cardTitle,
      cardMeta: options.classes.cardMeta,
      grid: options.classes.grid,
      routeHero: options.classes.routeHero
    }
  })

  return [
    '    <script>',
    `        window.__lifecycleConfig = ${config};`,
    '        window.__runLifecycleScenario = async function() {',
    '            const config = window.__lifecycleConfig;',
    '            const metrics = window.__lifecycleMetrics;',
    '            resetCollectedMetrics(metrics);',
    '            const before = readLifecycleState();',
    '            metrics.collectMutations = true;',
    '            const startedAt = performance.now();',
    '            let details = { affectedElementCount: 0, routeCount: 0, computedStyleValid: true };',
    '            if (config.scenarioId === "large-append") details = runLargeAppend(config);',
    '            if (config.scenarioId === "repeated-toggle") details = await runRepeatedToggle(config);',
    '            if (config.scenarioId === "theme-switch") details = runThemeSwitch(config);',
    '            if (config.scenarioId === "route-navigation") details = await runRouteNavigation(config);',
    '            if (config.scenarioId === "long-session") details = await runLongSession(config);',
    '            if (config.scenarioId === "large-dom") details = { affectedElementCount: countCards(), routeCount: 0, computedStyleValid: true };',
    '            await waitFrames(3);',
    '            metrics.collectMutations = false;',
    '            const after = readLifecycleState();',
    '            return {',
    '                elapsedMs: performance.now() - startedAt,',
    '                affectedElementCount: details.affectedElementCount || 0,',
    '                routeCount: details.routeCount || 0,',
    '                computedStyleValid: details.computedStyleValid ? 1 : 0,',
    '                runtimeMutationMs: metrics.runtimeMutationMs || 0,',
    '                runtimeGeneratedRuleCountDelta: after.runtimeGeneratedRuleCount - before.runtimeGeneratedRuleCount,',
    '                runtimeStyleRawBytesDelta: after.runtimeStyleRawBytes - before.runtimeStyleRawBytes,',
    '                mutationObserverCallbackCount: metrics.mutationObserverCallbackCount || 0,',
    '                mutationObserverCallbackDurationMs: metrics.mutationObserverCallbackDurationMs || 0',
    '            };',
    '        };',
    '        window.__readLifecycleState = readLifecycleState;',
    '        function runLargeAppend(config) {',
    '            const scratch = getScratch();',
    '            scratch.textContent = "";',
    '            const extra = config.appendRuleState === "new-rule" ? config.classes.cardNew : [];',
    '            for (let index = 0; index < config.appendCount; index++) scratch.appendChild(createCard(config, index, extra));',
    '            const target = scratch.querySelector(".lifecycle-card");',
    '            const style = target ? getComputedStyle(target) : null;',
    '            return { affectedElementCount: config.appendCount, routeCount: 0, computedStyleValid: Boolean(style) };',
    '        }',
    '        async function runRepeatedToggle(config) {',
    '            const cards = getCards();',
    '            for (let round = 0; round < config.toggleRounds; round++) {',
    '                const add = round % 2 === 0;',
    '                for (const card of cards) {',
    '                    toggleClasses(card, config.classes.cardActive, add);',
    '                    toggleClasses(card, config.classes.cardSelected, !add);',
    '                    toggleClasses(card, config.classes.cardExpanded, add);',
    '                }',
    '                await waitFrames(1);',
    '            }',
    '            return { affectedElementCount: cards.length * config.toggleRounds, routeCount: 0, computedStyleValid: cards.length > 0 };',
    '        }',
    '        function runThemeSwitch(config) {',
    '            const cards = getCards();',
    '            if (config.themeModel === "class-swap") {',
    '                for (const card of cards) { removeClasses(card, config.classes.cardLight); addClasses(card, config.classes.cardDark); }',
    '            }',
    '            if (config.themeModel === "data-attribute") {',
    '                for (const card of cards) card.classList.add("lifecycle-data-card");',
    '                document.documentElement.dataset.theme = "dark";',
    '            }',
    '            if (config.themeModel === "css-variable") {',
    '                for (const card of cards) card.classList.add("lifecycle-variable-card");',
    '                document.documentElement.dataset.theme = "dark";',
    '            }',
    '            const target = cards[0];',
    '            const color = target ? getComputedStyle(target).backgroundColor : "";',
    '            return { affectedElementCount: cards.length, routeCount: 0, computedStyleValid: Boolean(color) };',
    '        }',
    '        async function runRouteNavigation(config) {',
    '            const routes = ["home", "dashboard", "settings", "dashboard"];',
    '            for (const route of routes) {',
    '                renderRoute(config, route);',
    '                await waitFrames(1);',
    '            }',
    '            return { affectedElementCount: countCards(), routeCount: routes.length, computedStyleValid: countCards() > 0 };',
    '        }',
    '        async function runLongSession(config) {',
    '            const startedAt = performance.now();',
    '            let operations = 0;',
    '            while (performance.now() - startedAt < config.longSessionMs) {',
    '                runLargeAppend({ ...config, appendCount: 20, appendRuleState: operations % 2 ? "existing-rule" : "new-rule" });',
    '                await runRepeatedToggle({ ...config, toggleRounds: 1 });',
    '                runThemeSwitch({ ...config, themeModel: operations % 2 ? "class-swap" : "data-attribute" });',
    '                getScratch().textContent = "";',
    '                operations++;',
    '                await waitFrames(1);',
    '            }',
    '            return { affectedElementCount: operations * 20 + countCards() * operations, routeCount: 0, computedStyleValid: operations > 0 };',
    '        }',
    '        function renderRoute(config, route) {',
    '            const routeRoot = document.getElementById("lifecycle-route");',
    '            const count = route === "dashboard" ? 96 : route === "settings" ? 48 : 24;',
    '            const heading = route[0].toUpperCase() + route.slice(1);',
    '            routeRoot.innerHTML = `<div class="${classAttribute(config.classes.routeHero)}"><strong>${heading}</strong><p>${route} lifecycle route.</p></div><section id="lifecycle-grid" class="${classAttribute(config.classes.grid)}"></section>`;',
    '            const grid = document.getElementById("lifecycle-grid");',
    '            for (let index = 0; index < count; index++) grid.appendChild(createCard(config, index, route === "settings" ? config.classes.cardNew : []));',
    '        }',
    '        function createCard(config, index, extraClasses) {',
    '            const card = document.createElement("article");',
    '            addClasses(card, config.classes.cardBase);',
    '            addClasses(card, config.classes.cardLight);',
    '            if (extraClasses?.length) addClasses(card, extraClasses);',
    '            card.dataset.index = String(index);',
    '            const title = document.createElement("strong");',
    '            addClasses(title, config.classes.cardTitle);',
    '            title.textContent = `Item ${index + 1}`;',
    '            const meta = document.createElement("span");',
    '            addClasses(meta, config.classes.cardMeta);',
    '            meta.textContent = "Lifecycle";',
    '            card.append(title, meta);',
    '            return card;',
    '        }',
    '        function readLifecycleState() {',
    '            const runtime = globalThis.masterCSSRuntime;',
    '            const runtimeStyleText = runtime?.style?.textContent || runtime?.text || "";',
    '            const retainedClassNames = [...(runtime?.retainedClassNames || [])].map(String);',
    '            const retainedRuleCount = countRetainedRules(runtime, retainedClassNames);',
    '            const elements = [...document.querySelectorAll("*")];',
    '            const classTotal = elements.reduce((total, element) => total + element.classList.length, 0);',
    '            const fcp = performance.getEntriesByType("paint").find((entry) => entry.name === "first-contentful-paint");',
    '            return {',
    '                domNodeCount: elements.length,',
    '                averageClassCount: elements.length ? classTotal / elements.length : 0,',
    '                cssomRuleCount: countDocumentCSSOMRules(),',
    '                runtimeGeneratedRuleCount: runtime?.classUtilities?.size || countCSSRules(runtime?.style?.sheet?.cssRules),',
    '                runtimeStyleRawBytes: new TextEncoder().encode(runtimeStyleText).length,',
    '                runtimeStyleText,',
    '                retainedClassCount: retainedClassNames.length,',
    '                retainedRuleCount,',
    '                progressiveAdopted: runtime?.progressive ? 1 : 0,',
    '                fcpMs: fcp?.startTime || 0,',
    '                lcpMs: window.__lifecycleMetrics?.lcpMs || 0',
    '            };',
    '        }',
    '        function countRetainedRules(runtime, classNames) {',
    '            let total = 0;',
    '            for (const className of classNames) {',
    '                const rule = runtime?.retainedClassRules?.get?.(className);',
    '                if (Array.isArray(rule?.nodes)) total += rule.nodes.length;',
    '                else if (rule) total++;',
    '            }',
    '            return total;',
    '        }',
    '        function countDocumentCSSOMRules() {',
    '            let total = 0;',
    '            for (const sheet of document.styleSheets) {',
    '                try { total += countCSSRules(sheet.cssRules); } catch {}',
    '            }',
    '            return total;',
    '        }',
    '        function countCSSRules(rules) {',
    '            if (!rules) return 0;',
    '            let total = 0;',
    '            for (const rule of rules) total += "cssRules" in rule ? countCSSRules(rule.cssRules) : 1;',
    '            return total;',
    '        }',
    '        function resetCollectedMetrics(metrics) {',
    '            metrics.runtimeMutationMs = 0;',
    '            metrics.mutationObserverCallbackCount = 0;',
    '            metrics.mutationObserverCallbackDurationMs = 0;',
    '        }',
    '        function getCards() { return [...document.querySelectorAll(".lifecycle-card")]; }',
    '        function countCards() { return getCards().length; }',
    '        function getScratch() { return document.getElementById("lifecycle-scratch"); }',
    '        function addClasses(element, classes) { for (const className of classes || []) element.classList.add(className); }',
    '        function removeClasses(element, classes) { for (const className of classes || []) element.classList.remove(className); }',
    '        function toggleClasses(element, classes, force) { for (const className of classes || []) element.classList.toggle(className, force); }',
    '        function classAttribute(classes) { return (classes || []).join(" "); }',
    '        function waitFrames(count) { return new Promise((resolve) => { const step = () => count-- <= 0 ? resolve() : requestAnimationFrame(step); requestAnimationFrame(step); }); }',
    '    </script>'
  ].join('\n')
}

export function addStaticHarness(html: string) {
  return insertBeforeHeadEnd(html, '    <link rel="stylesheet" href="/style.css">')
}

export function addRuntimeHarness(html: string, options: { hideUntilRuntime: boolean }) {
  const withVisibility = options.hideUntilRuntime ? addHiddenAttribute(html) : html
  return insertBeforeHeadEnd(withVisibility, [
    '    <script>',
    '        (() => {',
    '            const NativeMutationObserver = window.MutationObserver;',
    '            window.MutationObserver = class BenchmarkLifecycleMutationObserver extends NativeMutationObserver {',
    '                constructor(callback) {',
    '                    super((records, observer) => {',
    '                        const metrics = window.__lifecycleMetrics;',
    '                        const startedAt = performance.now();',
    '                        try {',
    '                            callback(records, observer);',
    '                        } finally {',
    '                            if (metrics?.collectMutations) {',
    '                                metrics.mutationObserverCallbackCount++;',
    '                                metrics.mutationObserverCallbackDurationMs += performance.now() - startedAt;',
    '                            }',
    '                        }',
    '                    });',
    '                }',
    '            };',
    '        })();',
    '    </script>',
    '    <script src="/global.min.js"></script>',
    '    <script>',
    '        (() => {',
    '            const metrics = window.__lifecycleMetrics;',
    '            metrics.runtimeScriptLoadedMs = performance.now();',
    '            const Runtime = window.MasterCSSRuntime;',
    '            if (!Runtime) { metrics.error = "missing-runtime"; return; }',
    '            const originalObserve = Runtime.prototype.observe;',
    '            const originalEnsureClassRules = Runtime.prototype.ensureClassRules;',
    '            const originalDeleteClassRules = Runtime.prototype.deleteClassRules;',
    '            Runtime.prototype.observe = function(...args) {',
    '                const startedAt = performance.now();',
    '                const result = originalObserve.apply(this, args);',
    '                const finishedAt = performance.now();',
    '                metrics.runtimeObserveMs = finishedAt - startedAt;',
    '                metrics.runtimeReadyMs = finishedAt;',
    '                metrics.runtimeBootstrapMs = finishedAt - metrics.runtimeScriptLoadedMs;',
    '                metrics.progressiveAdopted = this.progressive ? 1 : 0;',
    '                window.__markLifecycleReady();',
    '                return result;',
    '            };',
    '            Runtime.prototype.ensureClassRules = function(...args) {',
    '                const startedAt = performance.now();',
    '                const result = originalEnsureClassRules.apply(this, args);',
    '                const elapsed = performance.now() - startedAt;',
    '                if (metrics.collectMutations) metrics.runtimeMutationMs += elapsed;',
    '                return result;',
    '            };',
    '            Runtime.prototype.deleteClassRules = function(...args) {',
    '                const startedAt = performance.now();',
    '                const result = originalDeleteClassRules.apply(this, args);',
    '                const elapsed = performance.now() - startedAt;',
    '                if (metrics.collectMutations) metrics.runtimeMutationMs += elapsed;',
    '                return result;',
    '            };',
    '        })();',
    '    </script>'
  ].join('\n'))
}

function renderLifecycleItems(classes: LifecycleClassModel, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const state = index % 4 === 0 ? classes.cardActive : classes.cardLight
    return [
      `                <article class="${classAttribute([...classes.cardBase, ...state])}" data-index="${index}">`,
      `                    <strong class="${classAttribute(classes.cardTitle)}">Item ${index + 1}</strong>`,
      `                    <span class="${classAttribute(classes.cardMeta)}">${index % 4 === 0 ? 'Active' : 'Idle'}</span>`,
      '                </article>'
    ].join('\n')
  }).join('\n')
}

function renderStaticClassSource(classes: LifecycleClassModel) {
  return `        <div style="display:none" aria-hidden="true" class="${classAttribute(getAllLifecycleClasses(classes))} lifecycle-data-card lifecycle-variable-card"></div>`
}

function getAllLifecycleClasses(classes: LifecycleClassModel) {
  return [
    ...classes.body,
    ...classes.shell,
    ...classes.header,
    ...classes.title,
    ...classes.subtitle,
    ...classes.panel,
    ...classes.grid,
    ...classes.cardBase,
    ...classes.cardLight,
    ...classes.cardActive,
    ...classes.cardSelected,
    ...classes.cardExpanded,
    ...classes.cardDark,
    ...classes.cardNew,
    ...classes.cardTitle,
    ...classes.cardMeta,
    ...classes.button,
    ...classes.routeShell,
    ...classes.routeHero,
    'text-center'
  ]
}

function getInitialItemCount(spec: BrowserLifecycleVariantSpec) {
  if (spec.nodeTarget) return Math.max(1, Math.floor(spec.nodeTarget / 3))
  if (spec.scenarioId === 'initial-load') return 160
  if (spec.scenarioId === 'theme-switch') return 320
  if (spec.scenarioId === 'route-navigation') return 96
  if (spec.scenarioId === 'long-session') return 240
  return 160
}

function addHiddenAttribute(html: string) {
  return html.replace(/<html([^>]*)>/i, (match, attrs: string) => (
    /\shidden(?:[\s=>]|$)/i.test(attrs)
      ? match
      : `<html${attrs} hidden>`
  ))
}

function insertBeforeHeadEnd(html: string, content: string) {
  return html.replace('</head>', `${content}\n</head>`)
}

function classAttribute(classes: string[]) {
  return classes.join(' ')
}

function escapeHTML(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]!)
}
