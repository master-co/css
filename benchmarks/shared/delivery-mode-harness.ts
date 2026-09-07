export function addStaticHarness(html: string) {
  return addReadyHarness(
    addStyleProbe(
      insertBeforeHeadEnd(html, '    <link rel="stylesheet" href="/style.css">')
    )
  )
}

export function addRuntimeHarness(html: string, options: {
  hideUntilRuntime: boolean
  hasStyleProbe?: boolean
}) {
  const withProbe = options.hasStyleProbe ? html : addStyleProbe(html)
  const withVisibility = options.hideUntilRuntime ? addHiddenAttribute(withProbe) : withProbe

  return insertBeforeHeadEnd(withVisibility, [
    '    <script>',
    '        window.__benchmarkReady = false;',
    '        window.__deliveryMetrics = {',
    '            runtimeScriptLoadedMs: 0,',
    '            runtimeReadyMs: 0,',
    '            runtimeBootstrapMs: 0,',
    '            runtimeObserveMs: 0,',
    '            progressiveAdopted: 0,',
    '            runtimeGeneratedRuleCount: 0,',
    '            runtimeStyleRawBytes: 0',
    '        };',
    '    </script>',
    '    <script src="/global.min.js"></script>',
    '    <script>',
    '        (() => {',
    '            const metrics = window.__deliveryMetrics;',
    '            metrics.runtimeScriptLoadedMs = performance.now();',
    '            const Runtime = window.MasterCSSRuntime;',
    '            if (!Runtime) { metrics.error = "missing-runtime"; return; }',
    '            const originalObserve = Runtime.prototype.observe;',
    '            Runtime.prototype.observe = function(...args) {',
    '                const startedAt = performance.now();',
    '                const result = originalObserve.apply(this, args);',
    '                const finishedAt = performance.now();',
    '                metrics.runtimeObserveMs = finishedAt - startedAt;',
    '                metrics.runtimeReadyMs = finishedAt;',
    '                metrics.runtimeBootstrapMs = finishedAt - metrics.runtimeScriptLoadedMs;',
    '                metrics.progressiveAdopted = this.progressive ? 1 : 0;',
    '                metrics.runtimeGeneratedRuleCount = countCSSRules(this.style?.sheet?.cssRules);',
    '                metrics.runtimeStyleRawBytes = new TextEncoder().encode(this.style?.textContent || this.text || "").length;',
    '                requestAnimationFrame(() => requestAnimationFrame(() => {',
    '                    const marker = document.getElementById("benchmark-loaded");',
    '                    marker.dataset.ready = "true";',
    '                    document.documentElement.dataset.benchmarkReady = "true";',
    '                    window.__benchmarkReady = true;',
    '                }));',
    '                return result;',
    '            };',
    '            function countCSSRules(rules) {',
    '                if (!rules) return 0;',
    '                let total = 0;',
    '                for (const rule of rules) {',
    '                    if ("cssRules" in rule) {',
    '                        total += countCSSRules(rule.cssRules);',
    '                    } else {',
    '                        total++;',
    '                    }',
    '                }',
    '                return total;',
    '            }',
    '        })();',
    '    </script>'
  ].join('\n'))
}

function addReadyHarness(html: string) {
  return insertBeforeBodyEnd(html, [
    '    <script>',
    '        window.__benchmarkReady = false;',
    '        requestAnimationFrame(() => requestAnimationFrame(() => {',
    '            const marker = document.getElementById("benchmark-loaded");',
    '            marker.dataset.ready = "true";',
    '            document.documentElement.dataset.benchmarkReady = "true";',
    '            window.__benchmarkReady = true;',
    '        }));',
    '    </script>'
  ].join('\n'))
}

export function addStyleProbe(html: string) {
  const probe = [
    '    <span id="benchmark-style-probe" class="text-center" hidden>style probe</span>',
    '    <div id="benchmark-loaded" hidden>loaded</div>'
  ].join('\n')
  return html.replace(/<body([^>]*)>/i, (match) => `${match}\n${probe}`)
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

function insertBeforeBodyEnd(html: string, content: string) {
  return html.replace('</body>', `${content}\n</body>`)
}
