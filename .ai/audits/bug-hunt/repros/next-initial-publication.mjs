import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'

const packageDir = process.env.BH_NEXT_PACKAGE_DIR
const evidence = process.env.BH_NEXT_HOST_EVIDENCE
const traced = process.env.BH_INITIAL_TRACE === '1'
const hostRead = process.env.BH_INITIAL_HOST_READ === '1'
const contextDependency = process.env.BH_INITIAL_CONTEXT === '1'
const pure = process.env.BH_INITIAL_PURE === '1'
const disableCache = process.env.BH_INITIAL_DISABLE_CACHE === '1'
const uncacheable = process.env.BH_INITIAL_UNCACHEABLE === '1'
const require = createRequire(join(packageDir, 'package.json'))
const root = mkdtempSync(join(packageDir, 'e2e/bug-hunt-initial-publication-'))
const report = { root, traced, hostRead, contextDependency, pure, disableCache, uncacheable, packageDir, compiler: require.resolve('@master/css-compiler/stylesheet'), bindingOverride: process.env.MASTER_CSS_NATIVE_BINDING_PATH ?? null, phases: [], errors: [] }
function collect(dir, visitor) {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const file = join(dir, name)
    if (statSync(file).isDirectory()) collect(file, visitor)
    else visitor(file)
  }
}
try {
  mkdirSync(join(root, 'app/nested'), { recursive: true })
  writeFileSync(join(root, 'package.json'), '{"private":true,"type":"module"}')
  const entrySource = pure ? '.original{color:red}\n' : '@import "@master/css";\n'
  writeFileSync(join(root, 'app/globals.css'), entrySource)
  writeFileSync(join(root, 'app/layout.jsx'), 'import "./globals.css";export default function Layout({children}){return <html><body>{children}</body></html>}')
  writeFileSync(join(root, 'app/page.jsx'), 'export default function Page(){return <main className="fg:red font:40px">Initial publication</main>}')
  writeFileSync(join(root, 'app/nested/page.jsx'), 'export default function Page(){return <main className="fg:blue font:32px">Nested</main>}')
  const wrapper = join(root, 'audit-loader.cjs'), log = join(root, 'publication.jsonl')
  writeFileSync(wrapper, `const fs=require('node:fs'),path=require('node:path');const actual=require(${JSON.stringify(join(packageDir, 'dist/stylesheet-loader.js'))}).default;
module.exports=function(source,map){const original=this,context=Object.create(this),callback=this.async(),dependencies=[];if(${uncacheable})this.cacheable(false);
context.addDependency=file=>{dependencies.push(file);original.addDependency(file)};
context.async=()=>((error,css,...rest)=>{const outputs=[...String(css||'').matchAll(/@import "([^"]+)";/g)].map(match=>{const file=path.resolve(path.dirname(original.resourcePath),decodeURIComponent(match[1]));if(${contextDependency})original.addContextDependency(path.dirname(file));return {file,exists:fs.existsSync(file),registered:dependencies.includes(file),metadata:fs.existsSync(file+'.assets.json')}});Promise.all(outputs.map(output=>${hostRead}?new Promise(resolve=>{original.fs.readFile(output.file,(error,bytes)=>{output.hostRead={error:error?String(error):null,bytes:bytes?.length};resolve()})}):Promise.resolve())).then(()=>{fs.appendFileSync(${JSON.stringify(log)},JSON.stringify({time:Date.now(),file:original.resourcePath,error:error?String(error):null,outputs,dependencies})+'\\n');callback(error,css,...rest)},callback)});
return actual.call(context,source,map)};`)
  writeFileSync(join(root, 'next.config.mjs'), `import {withMasterCSS} from ${JSON.stringify(pathToFileURL(join(packageDir, 'dist/index.js')).href)};
const config=await withMasterCSS({output:'export',experimental:{cpus:1,...(${disableCache}?{turbopackFileSystemCacheForBuild:false}:{})}});
if(${traced}){function visit(value){if(Array.isArray(value)){for(let i=0;i<value.length;i++){if(value[i]===${JSON.stringify(join(packageDir, 'dist/stylesheet-loader.js'))})value[i]=${JSON.stringify(wrapper)};else visit(value[i])}}else if(value&&typeof value==='object'){if(value.loader===${JSON.stringify(join(packageDir, 'dist/stylesheet-loader.js'))})value.loader=${JSON.stringify(wrapper)};for(const child of Object.values(value))visit(child)}}visit(config.turbopack.rules)}
export default config;`)
  if (pure) {
    const generator = join(root, 'audit-generator.cjs')
    writeFileSync(generator, `const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');module.exports=function(source){if(${uncacheable})this.cacheable(false);const directory=path.join(this.rootContext,'.master/stylesheets/pure');fs.mkdirSync(directory,{recursive:true});const output=path.join(directory,createHash('sha256').update(source).digest('hex')+'.css');fs.writeFileSync(output,source);this.addDependency(output);const href=path.relative(path.dirname(this.resourcePath),output).split(path.sep).join('/');fs.appendFileSync(${JSON.stringify(log)},JSON.stringify({time:Date.now(),file:this.resourcePath,outputs:[{file:output,exists:fs.existsSync(output),registered:true}],dependencies:[output]})+'\\n');return '@import "'+href+'";'};`)
    writeFileSync(join(root, 'next.config.mjs'), `export default {output:'export',experimental:{cpus:1,...(${disableCache}?{turbopackFileSystemCacheForBuild:false}:{})},turbopack:{rules:{'globals.css':{loaders:[${JSON.stringify(generator)}],as:'*.css'}}}};`)
  }
  let previousCallbacks = 0
  for (const phase of ['initial', 'changed-source', 'deleted-publications']) {
    if (phase === 'changed-source') writeFileSync(join(root, 'app/globals.css'), entrySource + '.updated{padding:13px}\n')
    if (phase === 'deleted-publications') rmSync(join(root, '.master/stylesheets'), { recursive: true, force: true })
    const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'build', '--turbopack'], {
      cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, detached: true, stdio: ['ignore', 'pipe', 'pipe']
    })
    let output = '', timedOut = false
    child.stdout.on('data', value => { output += value })
    child.stderr.on('data', value => { output += value })
    const timer = setTimeout(() => { timedOut = true;process.kill(-child.pid, 'SIGTERM') }, 120_000)
    const [code, signal] = await once(child, 'exit');clearTimeout(timer)
    const current = { phase, build: { code, signal, timedOut, log: output }, callbacks: [], publications: [], html: [], css: [] }
    if (existsSync(log)) {
      const callbacks = readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
      current.callbacks = callbacks.slice(previousCallbacks);previousCallbacks = callbacks.length
    }
    collect(join(root, '.master/stylesheets'), file => {
      current.publications.push({ file: relative(root, file), bytes: statSync(file).size, text: readFileSync(file, 'utf8') })
    })
    collect(join(root, 'out'), file => {
      if (file.endsWith('.css')) current.css.push({ file: relative(root, file), text: readFileSync(file, 'utf8') })
      if (!file.endsWith('.html')) return
      const text = readFileSync(file, 'utf8'), manifests = [...text.matchAll(/data-master-css-hydration-manifest="([^"]+)"/g)].map(match => match[1])
      current.html.push({ file: relative(root, file), manifests: manifests.map(href => ({ href, exists: existsSync(join(root, 'out', new URL(href, 'https://audit.invalid').pathname)) })) })
    })
    current.valid = code === 0 && ['out/index.html', 'out/nested.html'].every(file => current.html.some(item => item.file === file && (pure || item.manifests.length && item.manifests.every(manifest => manifest.exists))))
      && (phase === 'initial' || current.css.some(item => item.text.includes('.updated') && item.text.includes('13px')))
      && (!traced || current.callbacks.some(item => item.outputs.length && item.outputs.every(output => output.exists && output.registered && output.metadata)))
    report.phases.push(current)
    if (code !== 0) break
  }
} catch (error) { report.errors.push(String(error)) }
finally {
  writeFileSync(evidence, JSON.stringify(report, null, 2) + '\n')
  rmSync(root, { recursive: true, force: true })
}
console.log(JSON.stringify({ traced, phases: report.phases.map(item => ({ phase: item.phase, build: item.build.code, valid: item.valid, callbacks: item.callbacks.length, publications: item.publications.length })), errors: report.errors }))
process.exitCode = report.errors.length || report.phases.length !== 3 || report.phases.some(phase => !phase.valid) ? 1 : 0
