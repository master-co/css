import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

// Every build result is evidence, not an assertion that rejection is correct.
const packageDir = resolve(process.env.BH_NEXT_PACKAGE_DIR)
const evidence = resolve(process.env.BH_NEXT_HOST_EVIDENCE)
const requireNext = createRequire(join(packageDir, 'package.json'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const bundler = process.env.BH_NEXT_BUNDLER || 'turbopack'
const pure = process.env.BH_NEXT_PURE === '1'
const scenario = process.env.BH_NEXT_EDGE_CASE
const client = process.env.BH_NEXT_EDGE_CLIENT === '1'
const mixed = process.env.BH_NEXT_EDGE_MIXED === '1'
const remount = process.env.BH_NEXT_EDGE_REMOUNT === '1'
const conditionKeys = process.env.BH_NEXT_EDGE_CONDITIONS?.split(',')
if (conditionKeys) assert(conditionKeys.length === new Set(conditionKeys).size && conditionKeys.every(key => ['react-server', 'browser', 'import', 'require', 'node', 'style', 'default'].includes(key)) && conditionKeys.at(-1) === 'default')
assert(!remount || mixed || client, 'remount probe requires a Client consumer')
const browserNames = (process.env.BH_NEXT_BROWSERS || 'chromium,firefox,webkit').split(',')
assert(browserNames.every(name => ['chromium', 'firefox', 'webkit'].includes(name)))
const cases = {
  'acyclic-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}', valid: true
  },
  'encoded-composes': {
    a: '.direct{composes:shared from "./other%20module.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}', file: 'other module.module.css', valid: true
  },
  'literal-percent-composes': {
    a: '.direct{composes:shared from "./literal%2520name.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}', file: 'literal%20name.module.css', valid: true
  },
  'escaped-composes': {
    a: String.raw`.direct{composes:shared from "./other\20 module.module.css";color:#123456}`,
    b: '.shared{border-top:7px solid red}', file: 'other module.module.css', valid: true
  },
  'escaped-letter-composes': {
    a: String.raw`.direct{composes:shared from "./oth\65 r.module.css";color:#123456}`,
    b: '.shared{border-top:7px solid red}', valid: true
  },
  'raw-percent-composes': {
    a: '.direct{composes:shared from "./literal%20name.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}', file: 'literal%20name.module.css', valid: true
  },
  'package-conditions-composes': {
    a: '.direct{composes:shared from "@audit/css-edge";color:#123456}',
    b: '.shared{border-top:7px solid red}', package: true, conditions: true, valid: true
  },
  'query-composes': {
    a: '.direct{composes:shared from "./other.module.css?theme=dark";color:#123456}',
    b: '.shared{border-top:7px solid red}', valid: true
  },
  'fragment-composes': {
    a: '.direct{composes:shared from "./other.module.css#theme";color:#123456}',
    b: '.shared{border-top:7px solid red}', valid: true
  },
  'alias-composes': {
    a: '.direct{composes:shared from "audit-style";color:#123456}',
    b: '.shared{border-top:7px solid red}', alias: true, valid: true
  },
  'package-composes': {
    a: '.direct{composes:shared from "@audit/css-edge";color:#123456}',
    b: '.shared{border-top:7px solid red}', package: true, valid: true
  },
  'missing-composes': {
    a: '.direct{composes:missing from "./other.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}'
  },
  'independent-compose-cycle': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}.anchor{margin-left:11px}',
    b: '.shared{border-top:7px solid red}.dependent{composes:anchor from "./card.module.css";padding:13px}'
  },
  'recursive-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}',
    b: '.shared{composes:direct from "./card.module.css";border-top:7px solid red}'
  },
  'icss-value-cycle': {
    a: ':import("./other.module.css"){tone:tone}:export{own:#654321}.direct{color:tone}',
    b: ':import("./card.module.css"){own:own}:export{tone:#123456}.shared{color:own}'
  },
  'missing-icss-value': {
    a: ':import("./other.module.css"){tone:missing}.direct{color:tone}',
    b: ':export{tone:#123456}.shared{border-top:7px solid red}'
  }
}
assert(cases[scenario], 'known edge scenario')
const parent = join(packageDir, 'e2e');mkdirSync(parent, { recursive: true })
const root = mkdtempSync(join(parent, 'bug-hunt-module-edge-'))
const report = { scenario, bundler, pure, client, mixed, remount, conditionKeys, passScope: conditionKeys ? 'appearance-only; condition ownership compared separately' : 'appearance and original server condition contract', packageDir, input: cases[scenario], build: null, observations: [], stylesheets: [], errors: [], browserFailures: [], requestedBrowsers: browserNames }
let server
try {
  mkdirSync(join(root, 'app'))
  writeFileSync(join(root, 'package.json'), '{"private":true,"type":"module"}')
  const config = { output: 'export', experimental: { cpus: 1 }, turbopack: { root: '/Users/aron/master/css' } }
  writeFileSync(join(root, 'next.config.mjs'), pure ? `export default ${JSON.stringify(config)}` : `import {withMasterCSS} from ${JSON.stringify(relative(root, join(packageDir, 'dist/index.js')))};export default await withMasterCSS(${JSON.stringify(config)},{mode:'runtime',runtime:false})`)
  if (cases[scenario].alias) {
    const file = join(root, 'next.config.mjs')
    const original = readFileSync(file, 'utf8').replace('export default ', 'const config = ')
    writeFileSync(file, original + `;
const previous = config.webpack;
config.webpack = (...args) => {const value = previous ? previous(...args) : args[0];value.resolve.alias['audit-style'] = ${JSON.stringify(join(root, 'app/other.module.css'))};return value};
config.turbopack = {...config.turbopack,resolveAlias:{...config.turbopack?.resolveAlias,'audit-style':'./app/other.module.css'}};
export default config;`)
  }
  if (cases[scenario].package) {
    const packageRoot = join(root, 'node_modules/@audit/css-edge');mkdirSync(packageRoot, { recursive: true })
    const conditions = conditionKeys || (cases[scenario].conditions ? ['react-server','browser','import','require','node','style','default'] : ['style','default'])
    writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({name:'@audit/css-edge',type:'module',exports:{'.':Object.fromEntries(conditions.map(name => [name, './' + name + '.module.css']))}}))
    for (const name of conditions) writeFileSync(join(packageRoot, name + '.module.css'), '.shared{border-top:7px solid red;--origin:' + name + '}')
  }
  if (process.env.BH_NEXT_CONTEXT_TRACE === '1') {
    const traceLoader = join(root, 'trace-loader.cjs'), traceFile = join(root, 'loader-context.jsonl')
    writeFileSync(traceLoader, `const fs=require('node:fs');module.exports=function(source,map){const done=this.async();const row={keys:Object.keys(this),ruleTag:this.getOptions()?.contextTag,moduleKeys:Object.keys(this._module||{}),moduleLayer:this._module?.layer,moduleType:this._module?.type,resourcePath:this.resourcePath,resourceQuery:this.resourceQuery,target:this.target,mode:this.mode,version:this.version,rootContext:this.rootContext,resolutions:{}};const run=async()=>{for(const [name,options] of Object.entries({defaults:{},reactServer:{conditionNames:['react-server']},browser:{conditionNames:['browser']},import:{conditionNames:['import']}})){try{row.resolutions[name]=await this.getResolve(options)(this.context,'@audit/css-edge')}catch(error){row.resolutions[name]=String(error)}}fs.appendFileSync(${JSON.stringify(traceFile)},JSON.stringify(row)+'\\n');done(null,source,map)};run().catch(done)};`)
    const file = join(root, 'next.config.mjs'), original = readFileSync(file, 'utf8').replace('export default ', 'const tracedConfig = ')
    writeFileSync(file, original + `;
for(const [glob,collection] of Object.entries(tracedConfig.turbopack.rules||{})){
const rules=Array.isArray(collection)?collection:[collection];
tracedConfig.turbopack.rules[glob]=rules.flatMap(rule=>{
if(!rule.loaders?.some(item=>typeof item==='object'&&item.loader.endsWith('/stylesheet-loader.js')))return [rule];
if(!${JSON.stringify(process.env.BH_NEXT_RULE_TRACE === '1')})return [{...rule,loaders:[...rule.loaders,{loader:${JSON.stringify(traceLoader)}}]}];
const contexts=[['browser','browser'],['node',{all:[{not:'browser'},'node']}],['edge',{all:[{not:'browser'},{not:'node'},'edge-light']}],['other',{all:[{not:'browser'},{not:'node'},{not:'edge-light'}]}]];
return contexts.map(([contextTag,condition])=>({...rule,condition:{all:[rule.condition||{path:/.*/},condition]},loaders:[...rule.loaders,{loader:${JSON.stringify(traceLoader)},options:{contextTag}}]}));
});
}
export default tracedConfig;`)
  }
  writeFileSync(join(root, 'app/layout.jsx'), 'export default function Layout({children}){return <html><body>{children}</body></html>}')
  writeFileSync(join(root, 'app/page.jsx'), (client ? '"use client";' : '') + 'import styles from "./card.module.css";export default function Page(){return <div id="probe" className={styles.direct}>Probe</div>}')
  if (remount && client) writeFileSync(join(root, 'app/page.jsx'), '"use client";import {useState} from "react";import styles from "./card.module.css";export default function Page(){const [revision,setRevision]=useState(0);return <><button id="remount" onClick={()=>setRevision(value=>value+1)}>Remount</button><div key={revision} data-revision={revision} id="probe" className={styles.direct}>Client</div></>}')
  if (mixed) {
    writeFileSync(join(root, 'app/client.jsx'), '"use client";import styles from "./card.module.css";export default function Client(){return <div id="client-probe" className={styles.direct}>Client</div>}')
    if (remount) writeFileSync(join(root, 'app/client.jsx'), '"use client";import {useState} from "react";import styles from "./card.module.css";export default function Client(){const [revision,setRevision]=useState(0);return <><button id="remount" onClick={()=>setRevision(value=>value+1)}>Remount</button><div key={revision} data-revision={revision} id="client-probe" className={styles.direct}>Client</div></>}')
    writeFileSync(join(root, 'app/page.jsx'), 'import styles from "./card.module.css";import Client from "./client";export default function Page(){return <><div id="probe" className={styles.direct}>Server</div><Client/></>}')
  }
  writeFileSync(join(root, 'app/card.module.css'), (pure ? '' : '@master entry;@preserve native;') + cases[scenario].a)
  writeFileSync(join(root, 'app', cases[scenario].file || 'other.module.css'), cases[scenario].b)
  const child = spawn(process.execPath, [requireNext.resolve('next/dist/bin/next'), 'build', ...(bundler === 'webpack' ? ['--webpack'] : [])], { cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = '', timedOut = false
  for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { output += bytes; process.stdout.write(bytes) })
  const timeout = setTimeout(() => { timedOut = true; child.kill('SIGTERM') }, 120000)
  const [code, signal] = await once(child, 'exit');clearTimeout(timeout)
  report.build = { code, signal, timedOut, exported: existsSync(join(root, 'out/index.html')), log: output }
  if (code === 0 && report.build.exported) {
    const out = join(root, 'out')
    report.exportedProbeTags = readFileSync(join(out, 'index.html'), 'utf8').match(/<div\b[^>]*\bid="(?:client-)?probe"[^>]*>/g)
    function collect(dir) {
      for (const name of readdirSync(dir)) {
        const file = join(dir, name)
        if (statSync(file).isDirectory()) collect(file)
        else if (name.endsWith('.css')) report.stylesheets.push({ file: relative(out, file), text: readFileSync(file, 'utf8') })
      }
    }
    collect(out)
    server = createServer((req, res) => {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      const file = resolve(out, '.' + (path === '/' ? '/index.html' : path))
      if (!file.startsWith(out + '/') || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404);res.end();return }
      res.setHeader('content-type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(file)] || 'application/octet-stream')
      res.end(readFileSync(file))
    })
    server.listen(0, '127.0.0.1');await once(server, 'listening')
    for (const name of browserNames) {
      let browser
      try {
        browser = await browsers[name].launch({ headless: true, timeout: 15000 })
        const page = await browser.newPage()
        page.on('pageerror', error => report.errors.push({ browser: name, message: String(error) }))
        page.on('console', message => { if (message.type() === 'error') report.errors.push({ browser: name, console: message.text() }) })
        await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' })
        for (const phase of remount ? ['initial', 'remounted'] : ['initial']) {
        if (phase === 'remounted') {
          await page.locator('#remount').click()
          await page.waitForFunction(id => document.querySelector('#' + id)?.getAttribute('data-revision') === '1', mixed ? 'client-probe' : 'probe')
        }
        for (const id of mixed ? ['probe', 'client-probe'] : ['probe']) {
        const observation = await page.locator('#' + id).evaluate(el => {
          const style = getComputedStyle(el)
          const matchingRules = []
          function visit(rules) {
            for (const rule of rules) {
              if (rule.selectorText && el.matches(rule.selectorText)) matchingRules.push({ selector: rule.selectorText, declarations: rule.style.cssText })
              if (rule.cssRules) visit(rule.cssRules)
            }
          }
          for (const sheet of document.styleSheets) visit(sheet.cssRules)
          return { classes: el.className, color: style.color, border: style.borderTopWidth, margin: style.marginLeft, padding: style.paddingTop, origin: style.getPropertyValue('--origin').trim(), matchingRules }
        })
        report.observations.push({ browser: name, id, phase, ...observation, ...(cases[scenario].valid ? { pass: observation.color === 'rgb(18, 52, 86)' && observation.border === '7px' && !observation.classes.includes('undefined') && (conditionKeys || !cases[scenario].package || client || id === 'client-probe' || observation.origin === (bundler === 'webpack' ? 'style' : cases[scenario].conditions ? 'react-server' : 'default')) ? true : false } : {}) })
        }
        }
      } catch (error) { report.browserFailures.push({ browser: name, error: String(error.stack || error) }) } finally { if (browser) await browser.close() }
    }
  }
} catch (error) {
  report.harnessError = String(error.stack || error)
  process.exitCode = 1
} finally {
  if (server) await new Promise(done => server.close(done))
  const traceFile = join(root, 'loader-context.jsonl')
  if (existsSync(traceFile)) report.loaderContexts = readFileSync(traceFile, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
  writeFileSync(evidence, JSON.stringify(report, null, 2) + '\n')
  rmSync(root, { recursive: true, force: true })
}
console.log(JSON.stringify({ scenario, bundler, pure, build: report.build && { ...report.build, log: undefined }, observations: report.observations, harnessError: report.harnessError }))
