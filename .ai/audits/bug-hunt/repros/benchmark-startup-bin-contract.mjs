import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
assert(process.cwd().includes('master-css-bh-isolated-'))
const {resolveBenchmarkPackageFile}=await import(pathToFileURL(resolve('shared/runner.ts')))
const bin=resolveBenchmarkPackageFile('@master/css-cli','dist/bin/index.js')
const core=resolveBenchmarkPackageFile('@master/css-cli','dist/core.js')
const root=resolve('.results/bin-contract');mkdirSync(root,{recursive:true})
writeFileSync(resolve(root,'index.html'),'<p class="fg:red">control</p>')
writeFileSync(resolve(root,'input.css'),'@import "master.css";\n@source "./index.html";\n')
const rows=[]
function run(label,args) {
  const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:30000})
  rows.push({label,status:result.status,stdout:result.stdout,stderr:result.stderr,error:result.error?.message})
  return result
}
assert.equal(run('bin with generate args',[bin,'generate','index.html','-o','bin.css','-v','0']).status,0)
for(const [label,file] of [['bin passive import',bin],['core passive import',core]]) {
  const path=resolve(root,label.replaceAll(' ','-')+'.mjs')
  writeFileSync(path,`await import(${JSON.stringify(pathToFileURL(file).href)});console.log('AUDIT_IMPORT_RETURNED')\n`)
  const result=run(label,[path])
  if(file===bin) {assert.equal(result.status,1);assert(!result.stdout.includes('AUDIT_IMPORT_RETURNED'));assert.match(result.stderr,/Usage: master-css/)}
  else {assert.equal(result.status,0);assert.match(result.stdout,/AUDIT_IMPORT_RETURNED/)}
}
const probe=resolve(root,'core-command.mjs')
writeFileSync(probe,`const {default:run}=await import(${JSON.stringify(pathToFileURL(core).href)});await run(['node','master-css','generate','index.html','-o','core.css','-v','0']);console.log('AUDIT_COMMAND_RETURNED')\n`)
assert.equal(run('core explicit runProgram',[probe]).status,0)
const first=readFileSync(resolve(root,'bin.css')),second=readFileSync(resolve(root,'core.css'))
assert.deepEqual(first,second);assert(first.includes('.fg\\:red')&&first.includes('color:'))
console.log(JSON.stringify({controls:rows,cssBytes:first.length,cssHash:createHash('sha256').update(first).digest('hex'),pass:true}))
