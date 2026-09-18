// Batch 0248 probe: which stylesheet problems surface as thrown errors versus warning diagnostics in the 0244 compiler API. See evidence/0248-diagnostics-probe.log.
import { pathToFileURL } from 'node:url'
const compilerDir = process.env.BH_COMPILER_PACKAGE_DIR || '/Users/aron/master/css/.ai/audits/bug-hunt/tmp/0244-global-resource-api/packages/compiler'
const { compileStylesheet, compileRenderedStylesheet } = await import(pathToFileURL(compilerDir + '/dist/stylesheet/index-public.js'))
const baseManifest = { version: 1, utilities: [] }
const cases = {
  'unknown compose': '@master entry;.a{@compose totally-unknown-utility;color:red}',
  'invalid theme value': '@master entry;@theme{--x:}.a{color:var(--x)}',
  'unknown directive': '@master entry;@nonsense foo;.a{color:red}',
  'bad import': '@master entry;@import "./missing.css";.a{color:red}',
  'late unknown var': '.a{color:var(--missing)}'
}
for (const [label, source] of Object.entries(cases)) {
  for (const [api, fn] of [['compileStylesheet', compileStylesheet], ['compileRenderedStylesheet', compileRenderedStylesheet]]) {
    try {
      const r = await fn('/audit/entry.css', source, { baseManifest, preserveNativeCSS: true })
      console.log(label, '|', api, '| diagnostics=', JSON.stringify(r.diagnostics.map(d => ({ severity: d.severity, code: d.code, message: d.message?.slice(0, 120) }))))
    } catch (error) { console.log(label, '|', api, '| THROWS', String(error.message).slice(0, 200)) }
  }
}
