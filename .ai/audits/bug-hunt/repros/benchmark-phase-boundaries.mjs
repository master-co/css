import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {readFile,access} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {performance} from 'node:perf_hooks'
assert(process.cwd().includes('master-css-bh-isolated-'))
const require=createRequire(resolve('package.json'))
const {MasterCSSScanner}=await import(pathToFileURL(require.resolve('@master/css-tooling/scanner/node')))
const {createStylesheetCollection}=await import(pathToFileURL(require.resolve('@master/css-compiler/stylesheet')))
const temporary=createStylesheetCollection(),collectionPrototype=Object.getPrototypeOf(temporary);temporary.dispose()
const descriptors=[];let events=[],tamper=false,composeIndex=0
function wrap(prototype,name) {
 const descriptor=Object.getOwnPropertyDescriptor(prototype,name);assert.equal(typeof descriptor?.value,'function',name)
 descriptors.push([prototype,name,descriptor])
 Object.defineProperty(prototype,name,{...descriptor,value:async function(...args){
  const startedAt=performance.now()
  const options=name==='compose'?args[0]:undefined
  const mode=options?.includeGeneratedCSS===false?'native-only':options?.includeNativeCSS===false?'generated-only':'full'
  if(['init','scan','register','compose'].includes(name))await new Promise(resolve=>setTimeout(resolve,5))
  let result=await descriptor.value.apply(this,args)
  if(name==='compose'&&tamper&&++composeIndex===2)result={...result,css:result.css+'\n/* controlled mismatch */'}
  const endedAt=performance.now()
  events.push({name,mode,startedAt,endedAt,css:name==='compose'?result.css:undefined})
  return result
 }})
}
for(const name of ['init','scan','dispose'])wrap(MasterCSSScanner.prototype,name)
for(const name of ['register','compose'])wrap(collectionPrototype,name)
// Collection disposal is synchronous; preserve that contract.
const disposeDescriptor=Object.getOwnPropertyDescriptor(collectionPrototype,'dispose')
let disposed=0
Object.defineProperty(collectionPrototype,'dispose',{...disposeDescriptor,value:function(){disposed++;return disposeDescriptor.value.call(this)}})
try {
 for(const kind of ['compiler','extraction']) {
  events=[];composeIndex=0
  const {['run'+kind[0].toUpperCase()+kind.slice(1)+'Diagnostic']:run}=await import(pathToFileURL(resolve(`shared/${kind}-diagnostics.ts`)))
  const workspace=resolve(`.results/boundaries-${kind}`)
  const result=await run({workspace,fixtureId:'minimal',variantId:`minimal-master-static-${kind}`,round:0})
  const observations=JSON.parse(await readFile(resolve(workspace,'diagnostic/phase-observations.json'),'utf8'))
  const values=Object.fromEntries(result.samples.map(sample=>[sample.metricId,sample.value]))
  const calls=events.filter(event=>event.name==='compose')
  assert.deepEqual(calls.map(call=>call.mode),['full','full','generated-only','native-only'])
  assert.equal(calls[0].css,calls[1].css)
  for(const [index,id] of ['baseline-compose-ms','diagnostic-compose-ms','generated-only-compose-ms','native-only-compose-ms'].entries()) {
   const phase=observations.find(row=>row.metricId===id),call=calls[index]
   assert(phase.startedAt<=call.startedAt&&phase.endedAt>=call.endedAt,id)
   assert.equal(values[id],phase.endedAt-phase.startedAt)
  }
  for(const [method,id] of [['register','stylesheet-registration-ms'],['scan','source-scan-ms'],['init','scanner-init-ms']]) {
   const phase=observations.find(row=>row.metricId===id)
   assert(events.some(call=>call.name===method&&phase.startedAt<=call.startedAt&&phase.endedAt>=call.endedAt),id)
  }
  for(const observation of observations)assert.equal(observation.status,'ok')
  assert.equal(events.filter(event=>event.name==='dispose').length,1)
  console.log(JSON.stringify({kind,calls:events.map(({css,...event})=>event),observations,metricCount:result.samples.length,composeModes:calls.map(call=>call.mode),pass:true}))
 }
 tamper=true;events=[];composeIndex=0
 const {runCompilerDiagnostic}=await import(pathToFileURL(resolve('shared/compiler-diagnostics.ts')))
 const workspace=resolve('.results/boundaries-mismatch')
 await assert.rejects(runCompilerDiagnostic({workspace,fixtureId:'minimal',variantId:'mismatch',round:0}),/Diagnostic CSS mismatch/)
 assert.equal(events.filter(event=>event.name==='compose').length,2)
 assert.equal(events.filter(event=>event.name==='dispose').length,1)
 await assert.rejects(access(resolve(workspace,'dist/output.css')))
 assert.equal(disposed,3)
 console.log(JSON.stringify({controlledMismatchRejected:true,noOutputWritten:true,scannerAndCollectionsDisposed:3,pass:true}))
}finally{
 for(const [prototype,name,descriptor] of descriptors)Object.defineProperty(prototype,name,descriptor)
 Object.defineProperty(collectionPrototype,'dispose',disposeDescriptor)
}
