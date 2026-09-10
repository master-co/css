import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {createRequire} from 'node:module'
import {readFile,rm,access} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {brotliCompressSync} from 'node:zlib'
assert(process.cwd().includes('master-css-bh-isolated-'))
process.env.DOCS_PAGE_CSS_SIZE_FETCH_TIMEOUT_MS='300'
process.env.UPDATE_BENCHMARK_SNAPSHOT='false'
const {collectDocsPageCSSSizeSnapshot,writeSnapshot}=await import(pathToFileURL(resolve('docs-page-css-size/shared.ts')))
const require=createRequire(resolve('package.json'))
const {chromium,firefox,webkit}=require('@playwright/test')
const css='.probe{color:rgb(255,0,0)}'
const errorBody='<h1>Not CSS</h1>'
const rows=[];const timers=new Set()
const schedule=callback=>{const timer=setTimeout(()=>{timers.delete(timer);callback()},1000);timers.add(timer)}
const cases=[
 {id:'valid',valid:true,browser:true},
 {id:'mime-parameters',mime:'Text/CSS; charset=utf-8',valid:true},
 {id:'redirect-asset',valid:true,browser:true},
 {id:'redirect-page',valid:true,browser:true},
 {id:'empty',status:204,valid:true,browser:true},
 {id:'css404',status:404,error:/404/,browser:true},
 {id:'html404',status:404,mime:'text/html',error:/404/,browser:true},
 {id:'forbidden',status:403,error:/403/},
 {id:'server-error',status:500,mime:'text/html',error:/500/,browser:true},
 {id:'partial',status:206,error:/206/},
 ...['text/html','text/plain','application/json',''].map((mime,index)=>({id:`mime-${index}`,mime,error:/Expected CSS MIME/,browser:index===0})),
 {id:'document404',pageStatus:404,error:/404/},
 {id:'document500',pageStatus:500,error:/500/},
 {id:'document-mime',pageMime:'application/json',error:/Expected HTML MIME/},
 {id:'timeout-headers',error:/Failed to fetch CSS/},
 {id:'timeout-body',error:/Failed to fetch CSS/},
 {id:'truncated',error:/Failed to fetch CSS/},
 {id:'mixed',error:/404/}
]
const byId=new Map(cases.map(row=>[row.id,row]))
const server=createServer((request,response)=>{
 const url=new URL(request.url,'http://localhost');const [id,resource]=url.pathname.slice(1).split('/')
 const row=byId.get(id)
 if(!row){response.writeHead(404);response.end();return}
 if(resource==='entry'&&id==='redirect-page'){response.writeHead(302,{location:`/${id}/page`});response.end();return}
 if(['entry','page'].includes(resource)) {
  response.writeHead(row.pageStatus||200,{'content-type':row.pageMime||'text/html'})
  response.end(`<!doctype html><link rel="stylesheet" href="./style.css">${id==='mixed'?'<link rel="stylesheet" href="./bad.css">':''}<p class="probe">test</p>`);return
 }
 if(id==='redirect-asset'&&resource==='style.css'){response.writeHead(302,{location:`/${id}/final.css`});response.end();return}
 if(resource==='bad.css'){response.writeHead(404,{'content-type':'text/html'});response.end(errorBody);return}
 const headers={};if(row.mime!== '')headers['content-type']=row.mime||'text/css'
 if(id==='timeout-headers'){schedule(()=>response.end());return}
 if(id==='truncated')headers['content-length']='1024'
 response.writeHead(row.status||200,headers)
 if(id==='timeout-body'){response.flushHeaders();response.write(css.slice(0,5));schedule(()=>response.end());return}
 if(id==='truncated'){response.flushHeaders();response.write(css);response.destroy();return}
 response.end(row.status===204?'':row.mime&&row.mime!=='Text/CSS; charset=utf-8'&&row.mime!=='text/css'?errorBody:css)
})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const origin=`http://127.0.0.1:${server.address().port}`
const originalFetch=globalThis.fetch
let active
const inputs=JSON.parse(await readFile('docs-page-css-size/input.json','utf8'))
const inputURLs=new Set(inputs.map(row=>row.url))
globalThis.fetch=(url,options)=>originalFetch(inputURLs.has(String(url))?`${origin}/${active.id}/entry`:url,options)
const transient=resolve('.results/docs-page-css-size/snapshot.json')
try {
 for(active of cases) {
  await rm(transient,{force:true})
  let snapshot,error
  try{snapshot=await collectDocsPageCSSSizeSnapshot();await writeSnapshot(snapshot)}catch(cause){error=cause}
  if(active.valid) {
   assert.ifError(error);assert.equal(snapshot.pages.length,8)
   for(const page of snapshot.pages) {
    const expectedBytes=active.status===204?Buffer.alloc(0):Buffer.from(css)
    assert.equal(page.assets.length,1);assert.equal(page.assets[0].status,active.status||200)
    assert.equal(page.css.external.rawBytes,expectedBytes.length)
    assert.equal(page.css.external.brotliBytes,brotliCompressSync(expectedBytes).length)
    assert.equal(page.css.total.rawBytes,expectedBytes.length)
    assert.equal(page.assets[0].contentType,active.mime||'text/css')
    assert(page.assets[0].resolvedUrl.endsWith(active.id==='redirect-asset'?'/final.css':'/style.css'))
    assert(page.resolvedUrl.endsWith(active.id==='redirect-page'?'/page':'/entry'))
   }
   assert.deepEqual(JSON.parse(await readFile(transient,'utf8')),snapshot)
  }else{
   assert(error,active.id);assert.match(error.message,active.error,active.id)
   await assert.rejects(access(transient))
  }
  const row={control:active.id,accepted:!!snapshot,pages:snapshot?.pages.length,status:snapshot?.pages[0].assets[0].status,
   error:error?.message.split('\n')[0],completeSnapshotWritten:!!snapshot,pass:true}
  rows.push(row);console.log(JSON.stringify(row))
 }
 const browserRows=[]
 for(const [name,type] of Object.entries({chromium,firefox,webkit})) {
  const browser=await type.launch()
  try {
   const page=await browser.newPage()
   for(const control of cases.filter(row=>row.browser)) {
    await page.goto(`${origin}/${control.id}/entry`)
    const result=await page.locator('.probe').evaluate(element=>({color:getComputedStyle(element).color,rules:[...document.styleSheets].reduce((sum,sheet)=>sum+sheet.cssRules.length,0)}))
    const styled=control.valid&&control.status!==204
    assert.equal(result.color,styled?'rgb(255, 0, 0)':'rgb(0, 0, 0)',`${name}/${control.id}`)
    assert.equal(result.rules,styled?1:0)
    const row={browser:name,version:browser.version(),control:control.id,...result,pass:true};browserRows.push(row);console.log(JSON.stringify(row))
   }
  }finally{await browser.close()}
 }
 console.log(JSON.stringify({httpControls:rows.length,accepted:rows.filter(row=>row.accepted).length,rejected:rows.filter(row=>!row.accepted).length,browserControls:browserRows.length,pass:true}))
}finally{
 globalThis.fetch=originalFetch
 for(const timer of timers)clearTimeout(timer)
 server.closeAllConnections();await new Promise(resolve=>server.close(resolve))
}
