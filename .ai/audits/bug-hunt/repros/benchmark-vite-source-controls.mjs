import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {readFile} from 'node:fs/promises'
import {resolve,relative} from 'node:path'
import {pathToFileURL} from 'node:url'
assert(process.cwd().includes('master-css-bh-isolated-'))
const require=createRequire(resolve('package.json'))
const {MasterCSSScanner}=await import(pathToFileURL(require.resolve('@master/css-tooling/scanner/node')))
const manifest=JSON.parse(await readFile(require.resolve('@master/css-preset/default-manifest.json'),'utf8'))
const {installScannedSourceCounter}=await import(pathToFileURL(resolve('shared/scanned-sources.mjs')))
const root=resolve('.results/scanner-controls')
const cases=[
  ['index.html','<div class="fg:red"></div>',true],
  ['index.html','<div class="fg:red"></div>',true],
  [resolve(root,'index.html')+'?repeat','<div class="fg:red"></div>',true],
  ['src/main.js','const className="fg:blue"',true],
  ['src/main.js?mode=one','const className="fg:blue"',true],
  ['empty.js','',false],
  ['excluded/skip.js','const className="fg:green"',false],
  [resolve(root,'excluded/skip.js')+'?mode=one','const className="fg:green"',false],
  ['style.css','.x{color:red}',false],
  ['picture.png','not a source',false],
  ['component.vue?type=style','<style>.x{color:red}</style>',false],
  ['\0virtual.js','const className="fg:green"',false]
]
const descriptor=Object.getOwnPropertyDescriptor(MasterCSSScanner.prototype,'scan')
const observed=[]
MasterCSSScanner.prototype.scan=async function(source,content) {
  const result=await descriptor.value.call(this,source,content)
  observed.push({source,nonempty:!!content,changed:result})
  return result
}
const observer=Object.getOwnPropertyDescriptor(MasterCSSScanner.prototype,'scan')
const counter=installScannedSourceCounter(MasterCSSScanner.prototype,root,(cwd,source)=>resolve(cwd,source.split('?')[0]))
const scanner=new MasterCSSScanner({manifest,exclude:['excluded/**'],verbose:0},root)
let css
try {
  await scanner.init()
  for(const [source,content,shouldScan] of cases) {
    const before=observed.length
    const changed=await scanner.scanModule(source,content)
    const completedNonempty=observed.slice(before).some(row=>row.nonempty)
    assert.equal(completedNonempty,shouldScan,source)
    console.log(JSON.stringify({source,changed,completedNonempty,shouldScan,uniqueSources:counter.files.size,pass:true}))
  }
  const expected=['index.html','src/main.js']
  assert.deepEqual([...counter.files].map(source=>relative(root,source)).sort(),expected)
  assert(observed.some(row=>row.nonempty&&!row.changed))
  css=scanner.css.text
} finally {
  counter.restore()
  assert.deepEqual(Object.getOwnPropertyDescriptor(MasterCSSScanner.prototype,'scan'),observer)
  Object.defineProperty(MasterCSSScanner.prototype,'scan',descriptor)
}
const normal=new MasterCSSScanner({manifest,exclude:['excluded/**'],verbose:0},root)
try {
  await normal.init()
  for(const [source,content] of cases)await normal.scanModule(source,content)
  assert.equal(normal.css.text,css)
}finally{normal.removeAllListeners()}
assert.deepEqual(Object.getOwnPropertyDescriptor(MasterCSSScanner.prototype,'scan'),descriptor)
console.log(JSON.stringify({cases:cases.length,actualScans:observed,uniqueSources:2,cssUnchanged:true,descriptorRestored:true,pass:true}))
