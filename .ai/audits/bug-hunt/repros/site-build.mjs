import { spawnSync } from 'node:child_process'
import { openSync, closeSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:net'
const repo=fileURLToPath(new URL('../../../../',import.meta.url))
const portServer=createServer();await new Promise(r=>portServer.listen(0,'127.0.0.1',r));const port=portServer.address().port;await new Promise(r=>portServer.close(r))
const prefix=process.env.BH_EVIDENCE_PREFIX||'0046'
const env={...process.env,NEXT_PUBLIC_VERSION:'0.0.0-audit',NEXT_PUBLIC_URL:`http://127.0.0.1:${port}`,NEXT_TELEMETRY_DISABLED:'1',MASTER_CSS_DOGFOOD_PORT:String(port)}
const results=[]
function run(name,args) {
 const fd=openSync(repo+'.ai/audits/bug-hunt/evidence/'+prefix+'-'+name+'.log','w')
 const childEnv={...env};if(name==='dogfood')delete childEnv.NODE_OPTIONS
 const result=spawnSync(name==='dogfood'?process.execPath:'pnpm',name==='dogfood'?[repo+'node_modules/@playwright/test/cli.js','test','--config','tests/dogfood/playwright.config.ts']:args,{env:childEnv,stdio:['ignore',fd,fd],timeout:900000});closeSync(fd)
 const record={name,status:result.status,error:result.error?.message};results.push(record);console.log(JSON.stringify(record));return result.status===0
}
let built=run('public-env',['exec','tsx','scripts/resolve-public-env.ts','--write','.generated/public-env.json'])
for (const name of ['prepare-app','build:llms','build:play-compiler','build:next','postbuild:static']) { if (!built) break; built=run(name.replaceAll(':','-'),['run',name]) }
if (!process.env.BH_BROWSER_MATRIX) {run('lint',['run','lint']);run('type-check',['run','type-check'])}
if (built) {run('css-contract',['run','test:css-contract']);if (!process.env.BH_BROWSER_MATRIX) run('dogfood',['run','test:dogfood'])}
if (built && process.env.BH_SYNTAX_MIGRATION) run('syntax-migration',['run','test:syntax-migration'])
if(built) for (const browser of (process.env.BH_BROWSER_MATRIX||'chromium').split(',')) {
 const suffix=process.env.BH_BROWSER_MATRIX?'-'+browser:''
 const fd=openSync(repo+'.ai/audits/bug-hunt/evidence/'+prefix+suffix+'-interactions.log','w')
 const result=spawnSync(process.execPath,[repo+'.ai/audits/bug-hunt/repros/site-interactions.mjs',process.cwd()],{env:{...env,BH_BROWSER:browser,BH_EVIDENCE_PREFIX:prefix+suffix},stdio:['ignore',fd,fd],timeout:180000});closeSync(fd)
 results.push({name:'interactions'+suffix,status:result.status,error:result.error?.message});console.log(JSON.stringify(results.at(-1)))
}
console.log(JSON.stringify({built,results}));process.exitCode=results.some(r=>r.status!==0)?1:0
