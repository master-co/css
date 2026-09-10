import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {existsSync,readFileSync} from 'node:fs'
assert(process.cwd().includes('master-css-bh-isolated-'))
const result=spawnSync('pnpm',['exec','vitest','bench','docs-page-css-size','--run'],{
 env:{...process.env,UPDATE_BENCHMARK_SNAPSHOT:'false'},stdio:'inherit',timeout:90000
})
const path='.results/docs-page-css-size/snapshot.json'
if(existsSync(path)) {
 const snapshot=JSON.parse(readFileSync(path,'utf8'))
 const input=JSON.parse(readFileSync('docs-page-css-size/input.json','utf8'))
 assert.equal(snapshot.pages.length,input.length)
 assert(snapshot.limits.length>=3)
 for(const page of snapshot.pages) {
  assert(input.some(row=>row.name===page.name&&row.url===page.url))
  assert(page.status>=200&&page.status<300&&page.status!==206)
  assert(['text/html','application/xhtml+xml'].includes(page.contentType.split(';')[0].trim().toLowerCase()))
  for(const asset of page.assets.filter(asset=>asset.kind==='external')) {
   assert(asset.status>=200&&asset.status<300&&asset.status!==206)
   assert.equal(asset.contentType.split(';')[0].trim().toLowerCase(),'text/css')
  }
  for(const key of ['rawBytes','brotliBytes']) {
   for(const kind of ['external','inline'])assert.equal(page.css[kind][key],page.assets.filter(asset=>asset.kind===kind).reduce((n,asset)=>n+asset[key],0))
   assert.equal(page.css.total[key],page.css.external[key]+page.css.inline[key])
  }
  console.log(JSON.stringify({name:page.name,url:page.url,resolvedUrl:page.resolvedUrl,status:page.status,contentType:page.contentType,css:page.css,assets:page.assets,pass:true}))
 }
 console.log(JSON.stringify({pages:snapshot.pages.length,assets:snapshot.pages.reduce((n,page)=>n+page.assets.length,0),pass:true}))
}
console.log(JSON.stringify({suiteStatus:result.status,snapshotWritten:existsSync(path),error:result.error?.message}))
assert.equal(result.status,0,result.error?.message||'Original public docs suite failed')
assert(existsSync(path))
