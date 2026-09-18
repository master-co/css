import assert from 'node:assert/strict'
import { createRequire, SourceMap } from 'node:module'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, realpathSync, symlinkSync, statSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'

// Bounded transport probe, not the production Next graph implementation.
const require = createRequire(new URL('../../../../packages/next/package.json', import.meta.url))
const nextRequire = createRequire(require.resolve('next/package.json'))
const { webpack, NormalModule } = nextRequire('next/dist/compiled/webpack/webpack')
const { trace } = nextRequire('next/dist/trace')
const postcss = nextRequire('postcss')
const compilerRequire = createRequire(new URL('../../../../packages/compiler/package.json', import.meta.url))
const stylesheetURL = pathToFileURL(compilerRequire.resolve('@master/css-compiler/stylesheet')).href
const manifestURL = pathToFileURL(compilerRequire.resolve('@master/css-internal/project')).href
const nativeLoader = nextRequire.resolve('next/dist/build/webpack/loaders/postcss-loader/src/index.js')
const root = realpathSync(mkdtempSync(join(tmpdir(), 'next-postcss-transport-')))
const evidence = process.env.BH_NEXT_TRANSPORT_EVIDENCE
assert(evidence, 'BH_NEXT_TRANSPORT_EVIDENCE is required')
const report = { scope: 'Next bundled Webpack and native PostCSS loader; no actual Next app or candidate integration', root, nativeLoader, rows: [] }
const write = (name, value) => { const file = join(root, name);mkdirSync(dirname(file), { recursive: true });writeFileSync(file, value);return file }
const log = write('events.jsonl', '')
const record = row => writeFileSync(log, JSON.stringify(row) + '\n', { flag: 'a' })

try {
  const input = write('input.cjs', `
const fs=require('node:fs');
module.exports=function(){throw new Error('Input normal phase must not execute')};
module.exports.pitch=function(){
 const snapshot=this.getOptions().snapshot;
 this.addDependency(snapshot);
 const value=JSON.parse(fs.readFileSync(snapshot,'utf8'));
 this.addDependency(this.resourcePath);
 this.callback(null,value.css,value.map);
};
`)
  const capture = write('capture.cjs', `
module.exports=function(css,map,meta){return 'module.exports='+JSON.stringify({css,map,processed:Boolean(meta?.auditProcessed)})};
`)
  const dispatcher = write('dispatcher.cjs', `
const fs=require('node:fs');
module.exports=function(css,map,meta){
 const options=this.getOptions();
 fs.appendFileSync(${JSON.stringify(log)},JSON.stringify({kind:meta?.auditProcessed?'skip':'delegate',file:this.resourcePath,query:this.resourceQuery})+'\\n');
 if(meta?.auditProcessed)return this.callback(null,css,map,meta);
 const host=Object.create(this);host.getOptions=()=>options.nativeOptions;
 return require(options.nativeLoader).default.call(host,css,map,meta);
};
`)
  const bridge = write('bridge.cjs', `
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=function(source){
 const done=this.async(),host=this,options=this.getOptions();
 const run=async()=>{
  const {compileRenderedStylesheet}=await import(${JSON.stringify(stylesheetURL)});
  const {defaultBuildManifest}=await import(${JSON.stringify(manifestURL)});
  const lowered=await compileRenderedStylesheet(host.resourcePath,source,{
   baseManifest:defaultBuildManifest,projectDir:host.rootContext,preserveNativeCSS:true,
   delivery:{entryURL:'./entry.css',stylesheetURL:()=>{throw new Error('Multi-file graph out of transport scope')},resourceURL:()=>{throw new Error('Resources out of transport scope')}}
  });
  if(lowered.generatedCSS)throw new Error('Global classification out of transport scope');
  if(lowered.stylesheets.length!==1)throw new Error('Only one authored file allowed');
  const asset=lowered.stylesheets[0],value=JSON.stringify({css:asset.css,map:JSON.parse(asset.sourceMap)});
  const snapshot=path.join(host.rootContext,crypto.createHash('sha256').update(value).digest('hex')+'.json');
  if(!fs.existsSync(snapshot))fs.writeFileSync(snapshot,value,{flag:'wx'});
  const native=host.loaders.find(loader=>loader.path===options.dispatcher);
  if(!native?.request)throw new Error('Native option reference unavailable');
  const request='!!'+options.capture+'!'+native.request+'!'+options.input+'?'+JSON.stringify({snapshot})+'!'+host.resource;
  fs.appendFileSync(${JSON.stringify(log)},JSON.stringify({kind:'capture',file:host.resourcePath,request,snapshot,lowered:asset.css,original:source})+'\\n');
  // A poison input proves the nested request cannot silently read the file again.
  if(options.poison)fs.writeFileSync(host.resourcePath,'INVALID CSS {');
  try {
   const processed=await host.importModule(request);
   done(null,processed.css,processed.map,{auditProcessed:true});
  } finally {if(options.poison)fs.writeFileSync(host.resourcePath,source)}
 };
 run().catch(done);
};
`)
  const original = '/* Unicode 前置 */\n@master entry;\n@preserve native;\n.original {\n  @compose p:2rem;\n  border-top:1px solid red;\n  color:#123456;\n}'
  const ordinary = '/* Unicode 前置 */\n.original {\n  padding:2rem;\n  border-top:1px solid red;\n  color:#123456;\n}'
  for (const scenario of ['configured', 'different-options', 'ordinary', 'empty', 'error']) {
    const start = readFileSync(log, 'utf8').length
    const file = write(scenario + '/card.module.css', scenario === 'ordinary' ? ordinary : original)
    const dependency = write(scenario + '/dependency.txt', 'dependency')
    const buildDependency = write(scenario + '/build-dependency.cjs', 'module.exports=1')
    const contextDependency = join(dirname(file), 'context');mkdirSync(contextDependency)
    const missingDependency = join(dirname(file), 'missing.css')
    const expectedBorder = scenario === 'different-options' ? '9px' : '7px'
    let factoryCalls = 0
    const plugin = {
      postcssPlugin: 'audit-native-transport',
      Once(css, { result }) {
        record({ kind: 'plugin-once', scenario, file: css.source?.input.file, from: result.opts.from, to: result.opts.to, css: css.toString() })
        result.messages.push(
          { type: 'dependency', plugin: this.postcssPlugin, file: dependency },
          { type: 'build-dependency', plugin: this.postcssPlugin, file: buildDependency },
          { type: 'missing-dependency', plugin: this.postcssPlugin, file: missingDependency },
          { type: 'dir-dependency', plugin: this.postcssPlugin, dir: contextDependency },
          { type: 'asset', plugin: this.postcssPlugin, file: scenario + '-asset.txt', content: 'native-asset' }
        )
        result.warn('native warning survives transport')
        if (scenario === 'error') throw css.error('native deliberate failure')
        css.walkRules(rule => { if (rule.selector === '.original') rule.selector = '.direct' })
        css.walkDecls(decl => {
          if (decl.prop === 'padding') decl.value = '3rem'
          if (decl.prop === 'border-top') decl.value = expectedBorder + ' solid red'
        })
        css.append({ selector: '.pass-counter', nodes: [{ prop: '--calls', value: '1' }] })
      }
    }
    const nativeOptions = { sourceMap: true, postcss: async () => {
      factoryCalls++
      return { postcssWithPlugins: postcss(scenario === 'empty' ? [] : [plugin]) }
    } }
    const readEvents = []
    const compiler = webpack({
      mode: 'development', context: root, target: 'node', devtool: false, cache: false,
      entry: file + '?variant=' + scenario,
      output: { path: join(root, 'out-' + scenario), filename: 'result.cjs', library: { type: 'commonjs2' } },
      module: { rules: [{ test: /\.css$/, use: [
        capture,
        { loader: dispatcher, ident: 'native-' + scenario, options: { nativeLoader, nativeOptions } },
        ...(scenario === 'ordinary' ? [] : [{ loader: bridge, options: { dispatcher, capture, input, poison: true } }])
      ] }] },
      plugins: [{ apply(compiler) { compiler.hooks.compilation.tap('Audit', compilation => {
        const hooks = NormalModule.getCompilationHooks(compilation)
        hooks.loader.tap('Audit', context => { context.currentTraceSpan = trace('audit-postcss-transport') })
        for (const scheme of [undefined, 'file']) hooks.readResource.for(scheme).tap({ name: 'Audit', stage: -1000 }, context => { if (context.resourcePath === file) readEvents.push(context.resource) })
      }) } }]
    })
    let stats
    try { stats = await new Promise((resolve, reject) => compiler.run((error, stats) => error ? reject(error) : resolve(stats))) }
    finally { await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve())) }
    const messages = stats.toJson({ all: false, errors: true, warnings: true })
    const compilation = stats.compilation
    const events = readFileSync(log, 'utf8').slice(start).trim().split('\n').filter(Boolean).map(JSON.parse)
    const row = { scenario, factoryCalls, readEvents, events, errors: messages.errors, warnings: messages.warnings,
      dependencies: { files: [...compilation.fileDependencies], build: [...compilation.buildDependencies], missing: [...compilation.missingDependencies], contexts: [...compilation.contextDependencies] },
      assets: Object.keys(compilation.assets), output: null, checks: {} }
    report.rows.push(row)
    assert.equal(factoryCalls, 1, scenario + ': exact native options factory reused once')
    assert.equal(readEvents.length, 1, scenario + ': nested input never rereads poisoned original')
    assert.equal(readFileSync(file, 'utf8'), scenario === 'ordinary' ? ordinary : original)
    row.checks.nativeOptionReferenceAndImmutableRead = true
    if (scenario === 'error') {
      assert(stats.hasErrors())
      assert(messages.errors.some(error => error.message.includes('native deliberate failure')))
      assert(row.dependencies.files.includes(file))
      assert.equal(events.filter(event => event.kind === 'skip').length, 0)
      row.checks.errorPropagatesWithoutFallback = true
      continue
    }
    assert(!stats.hasErrors(), JSON.stringify(messages.errors))
    row.output = require(join(root, 'out-' + scenario, 'result.cjs'))
    assert.equal(row.output.processed, scenario !== 'ordinary')
    assert.equal(events.filter(event => event.kind === 'skip').length, scenario === 'ordinary' ? 0 : 1)
    assert.equal(events.filter(event => event.kind === 'delegate').length, 1)
    assert(!row.output.css.includes('@compose'))
    if (scenario !== 'empty') {
      assert(row.output.css.includes('.direct'))
      assert(row.output.css.includes(expectedBorder))
      assert(row.output.css.includes('3rem'))
      assert.equal(row.output.css.match(/--calls/g)?.length, 1)
      assert.equal(events.filter(event => event.kind === 'plugin-once').length, 1)
      const event = events.find(event => event.kind === 'plugin-once')
      assert.equal(event.file, file);assert.equal(event.from, file);assert.equal(event.to, file)
      assert(row.dependencies.files.includes(dependency))
      assert(row.dependencies.build.includes(buildDependency))
      assert(row.dependencies.missing.includes(missingDependency))
      assert(row.dependencies.contexts.includes(contextDependency))
      assert(row.assets.includes(scenario + '-asset.txt'))
      assert(messages.warnings.some(warning => warning.message.includes('native warning survives transport')))
      row.checks.nativeContextMessagesAndSingleProcessing = true
    }
    const selector = scenario === 'empty' ? '.original' : '.direct'
    const before = row.output.css.slice(0, row.output.css.indexOf(selector)).split('\n')
    const entry = new SourceMap(row.output.map).findEntry(before.length - 1, before.at(-1).length)
    const source = scenario === 'ordinary' ? ordinary : original
    const authoredBefore = source.slice(0, source.indexOf('.original')).split('\n')
    row.mapCheck = { entry, expectedFile: file, expectedLine: authoredBefore.length - 1, expectedColumn: authoredBefore.at(-1).length, fullSource: row.output.map.sourcesContent.includes(source) }
    // Keep empty-pipeline behavior as an observation, not an assumed map fix.
    row.mapCheck.pass = [file, pathToFileURL(file).href].includes(entry.originalSource) && entry.originalLine === row.mapCheck.expectedLine && entry.originalColumn === row.mapCheck.expectedColumn && row.mapCheck.fullSource
    if (scenario !== 'empty') assert(row.mapCheck.pass, JSON.stringify(row.mapCheck))
    row.checks.outputAndMap = scenario === 'empty' ? 'observed' : true
  }
  if (process.env.BH_NEXT_TRANSPORT_APP === '1') {
    const client = process.env.BH_NEXT_TRANSPORT_CLIENT === '1'
    const pure = process.env.BH_NEXT_TRANSPORT_PURE === '1'
    const app = join(root, 'next-app');mkdirSync(app)
    symlinkSync(resolve('packages/next/node_modules'), join(app, 'node_modules'), 'dir')
    write('next-app/package.json', '{"private":true,"type":"module"}')
    write('next-app/app/layout.jsx', 'export default function Layout({children}){return <html><body>{children}</body></html>}')
    write('next-app/app/page.jsx', (client ? '"use client";' : '') + 'import styles from "./card.module.css";export default function Page(){return <div id="probe" className={styles.direct}>Native transport</div>}')
    const inline = write('next-app/inline.cjs', 'module.exports=function(css,map){this.callback(null,css.replace("border-top:1px","border-top:3px"),map)}')
    write('next-app/app/card.module.css', (pure ? '' : '@master entry;@preserve native;') + '.original{composes:shared from ' + JSON.stringify(inline + '!./other.module.css') + ';' + (pure ? 'padding:2rem;' : '@compose p:2rem;') + 'color:#123456}')
    write('next-app/app/other.module.css', '.shared{border-top:1px solid red}')
    const pluginFile = write('next-app/plugin.cjs', `
const fs=require('node:fs');module.exports=()=>({postcssPlugin:'audit-actual-native',Once(css){
 fs.appendFileSync(${JSON.stringify(log)},JSON.stringify({kind:'actual-plugin-once',file:css.source?.input.file,css:css.toString()})+'\\n');
 css.walkRules(rule=>{if(rule.selector==='.original')rule.selector='.direct'});
 css.walkDecls(decl=>{if(decl.prop==='padding'&&decl.value==='2rem')decl.value='3rem';if(decl.prop==='border-top'&&decl.value==='3px solid red')decl.value='7px solid red'});
}});module.exports.postcss=true;
`)
    write('next-app/postcss.config.cjs', 'module.exports={plugins:{' + JSON.stringify(pluginFile) + ':{}}}')
    write('next-app/next.config.mjs', `
let ident=0;
function transform(rule){
 if(!rule||typeof rule!=='object')return rule;
 for(const key of ['rules','oneOf'])if(rule[key])rule[key]=rule[key].map(transform);
 if(Array.isArray(rule.use)&&rule.use.some(item=>item?.loader?.includes('/postcss-loader/'))){
  rule.use=rule.use.flatMap(item=>{
   if(item?.loader?.includes('/postcss-loader/'))return [
    {loader:${JSON.stringify(dispatcher)},ident:'audit-native-'+ident++,options:{nativeLoader:item.loader,nativeOptions:item.options}},
    {loader:${JSON.stringify(bridge)},options:${JSON.stringify({ dispatcher, capture, input, poison: false })}}
   ];
   if(item?.loader?.includes('/css-loader/'))return {...item,options:{...item.options,importLoaders:Number(item.options?.importLoaders||0)+1}};
   return [item];
  });
 }
 return rule;
}
export default {output:'export',experimental:{cpus:1},webpack(config){if(!${pure})config.module.rules=config.module.rules.map(transform);return config}};
`)
    const offset = readFileSync(log, 'utf8').length
    const child = spawn(process.execPath, [nextRequire.resolve('next/dist/bin/next'), 'build', '--webpack'], { cwd: app, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = '', timedOut = false
    for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { output += bytes;process.stdout.write(bytes) })
    const timeout = setTimeout(() => { timedOut = true;child.kill('SIGTERM') }, 120000)
    const [code, signal] = await once(child, 'exit');clearTimeout(timeout)
    const host = report.actualNext = { client, pure, code, signal, timedOut, log: output, events: readFileSync(log, 'utf8').slice(offset).trim().split('\n').filter(Boolean).map(JSON.parse), browsers: [], stylesheets: [] }
    assert.equal(code, 0, 'actual Next build')
    const out = join(app, 'out')
    function collect(directory) { for (const name of readdirSync(directory)) { const file = join(directory, name);if (statSync(file).isDirectory()) collect(file);else if (name.endsWith('.css')) host.stylesheets.push({ file, css: readFileSync(file, 'utf8') }) } }
    collect(out)
    const server = createServer((req, res) => {
      const file = resolve(out, '.' + (req.url === '/' ? '/index.html' : decodeURIComponent(new URL(req.url, 'http://localhost').pathname)))
      if (!file.startsWith(out + '/') || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404);res.end();return }
      res.setHeader('content-type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(file)] || 'application/octet-stream');res.end(readFileSync(file))
    })
    server.listen(0, '127.0.0.1');await once(server, 'listening')
    const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
    try {
      for (const name of ['chromium', 'webkit']) {
        const browser = await browsers[name].launch({ headless: true, timeout: 15000 })
        try {
          const page = await browser.newPage()
          await page.goto('http://127.0.0.1:' + server.address().port + '/', { waitUntil: 'networkidle' })
          const actual = await page.locator('#probe').evaluate(el => { const css = getComputedStyle(el);return { classes: el.className, padding: css.paddingTop, border: css.borderTopWidth, color: css.color } })
          host.browsers.push({ name, ...actual, pass: actual.padding === '48px' && actual.border === '7px' && actual.color === 'rgb(18, 52, 86)' })
        } finally { await browser.close() }
      }
    } finally { await new Promise(done => server.close(done)) }
    host.behaviorPass = host.browsers.every(row => row.pass)
    if (!host.behaviorPass) process.exitCode = 1
    const byKind = kind => host.events.filter(event => event.kind === kind)
    if (!pure) {
      assert.equal(byKind('actual-plugin-once').length, byKind('delegate').length)
      assert.equal(byKind('skip').length, byKind('delegate').length)
    }
    assert(byKind('actual-plugin-once').some(event => event.file.endsWith('/other.module.css') && /border-top:\s*3px/.test(event.css)))
    assert(byKind('actual-plugin-once').every(event => !event.css.includes('@compose')))
    host.checks = { inlineBeforePostcss: true, loweredBeforePostcss: pure ? 'native-equivalent input' : true, everyNativeCallOnce: pure ? 'no dispatcher' : true, publicExportsAndBrowser: host.behaviorPass }
  }
} catch (error) {
  report.harnessError = String(error.stack || error)
  process.exitCode = 1
} finally {
  report.events = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : []
  rmSync(root, { recursive: true, force: true })
  report.cleaned = !existsSync(root)
  writeFileSync(evidence, JSON.stringify(report, null, 2) + '\n')
}
console.log(JSON.stringify({ rows: report.rows.map(row => ({ scenario: row.scenario, checks: row.checks, map: row.mapCheck, errors: row.errors.length })), cleaned: report.cleaned, harnessError: report.harnessError }))
