import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {resolve,relative} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
assert(process.cwd().includes('master-css-bh-isolated-'))
const require=createRequire(resolve('package.json'))
const {MasterCSSScanner}=await import(pathToFileURL(require.resolve('@master/css-tooling/scanner/node')))
const {default:masterCSS}=await import(pathToFileURL(require.resolve('@master/css-vite')))
const {build}=await import(pathToFileURL(require.resolve('vite')))
const {runBuildDiagnostic}=await import(pathToFileURL(resolve('shared/build-diagnostics.ts')))
const {findCSSFiles,readFiles}=await import(pathToFileURL(resolve('shared/runner.ts')))
const {staticFixtureIds}=await import(pathToFileURL(resolve('fixtures/static.ts')))
const failures=[]
for(const fixtureId of staticFixtureIds) {
  const workspace=resolve(`.results/observation-${fixtureId}`),scans=[]
  const descriptor=Object.getOwnPropertyDescriptor(MasterCSSScanner.prototype,'scan')
  MasterCSSScanner.prototype.scan=async function(source,content) {
    const result=await descriptor.value.call(this,source,content)
    if(resolve(this.cwd)===workspace)scans.push({source,bytes:Buffer.byteLength(content),changed:result})
    return result
  }
  let result
  try {result=await runBuildDiagnostic({workspace,fixtureId,toolId:'master-vite-diagnostic',variantId:`${fixtureId}-master-vite-diagnostic`,round:0})}
  finally {Object.defineProperty(MasterCSSScanner.prototype,'scan',descriptor)}
  const measuredCSS=await readFiles(await findCSSFiles(resolve(workspace,'dist')))
  await build({root:workspace,configFile:false,logLevel:'silent',plugins:masterCSS({mode:'static'}),
    build:{outDir:'dist',emptyOutDir:true,rollupOptions:{input:'index.html'}}})
  const normalCSS=await readFiles(await findCSSFiles(resolve(workspace,'dist')))
  assert.deepEqual(measuredCSS,normalCSS,'Instrumentation changed CSS')
  const unique=[...new Set(scans.filter(scan=>scan.bytes&&!scan.source.startsWith('\0')).map(scan=>resolve(workspace,scan.source.split('?')[0])))].sort()
  const values=Object.fromEntries(result.samples.map(sample=>[sample.metricId,sample.value]))
  const expectedTimingIds=['vite-master-module-scan-ms','vite-master-style-entry-ms','vite-master-generate-bundle-ms']
  const missingTimings=expectedTimingIds.filter(id=>!Object.hasOwn(values,id))
  const sourceArtifact=result.artifacts.find(artifact=>artifact.path.endsWith('/scanned-sources.json'))
  let recordedSources
  if(sourceArtifact)recordedSources=JSON.parse(await readFile(resolve('..',sourceArtifact.path),'utf8'))
  let pass=true
  try {
    assert.equal(values['source-file-count'],unique.length)
    assert.deepEqual(missingTimings,[])
    assert.deepEqual(recordedSources,unique.map(source=>relative(workspace,source)).sort())
  }catch(error){pass=false;failures.push({fixtureId,error:error.message})}
  console.log(JSON.stringify({fixtureId,values,scans,expectedUniqueSources:unique.map(source=>relative(workspace,source)),recordedSources,
    missingTimings,cssBytes:measuredCSS.length,cssHash:createHash('sha256').update(measuredCSS).digest('hex'),matchesUninstrumented:true,pass}))
}
assert.deepEqual(failures,[])
