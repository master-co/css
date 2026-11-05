import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises'
import {join, resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const source='6bf9adc4432b67e62613caea59d3b554711b4d54', repo='master-co/css', repoId=434642460
const originalRun='42053502169:1', tag='v2.0.0'
const cwd=process.cwd(), command=process.argv[2]
assert.ok(['preflight','identity','manifest'].includes(command))
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',cwd}).trim()
assert.equal(git('rev-parse','HEAD'),source)
assert.equal(git('status','--porcelain','--untracked-files=no'),'')
const moduleAt=name=>import(pathToFileURL(join(cwd,'scripts',name+'.mjs')))
const {releaseMetadata,prepareIdentity,createManifest,verifyOutput,sha256,jsonBytes}=await moduleAt('pages-site-manifest')
const {registryFromState,verifyPublicRegistry}=await moduleAt('pages-site-release')
const {assertReleaseProvenanceProof}=await moduleAt('release-registry-provenance')
const {readRegistryTags}=await moduleAt('semantic-release-promotion')
const {verifyRecoverySource,verifyRestoredEvidence,extractEvidencePython}=await moduleAt('release-recovery-artifact')
const metadata=releaseMetadata({repository:repo,revision:source,version:'2.0.0',tag,channel:'main',
  deliveryBranch:'codex/pages-stable',project:'master-css-production',subdomain:'master-css-production.pages.dev',
  origin:'https://css.master.co',imageTransformations:false})
const productEnv={PUBLIC_URL:metadata.origin,PUBLIC_VERSION:metadata.version,PUBLIC_COMMIT_REF:'main',MASTER_CSS_IMAGE_TRANSFORMATIONS:'false'}
for(const [key,value] of Object.entries(productEnv)) assert.equal(process.env[key],value,key)
const stateRoot=resolve('release-artifacts/recovery-final')
const localReceipt=resolve('release-artifacts/recovery-site-source.json')
const statePath=join(stateRoot,'promotion-state.json')
const names=[]
for(const entry of await readdir('packages',{withFileTypes:true})) {
 if(!entry.isDirectory()) continue
 try{const pkg=JSON.parse(await readFile(join('packages',entry.name,'package.json'))); if(!pkg.private) names.push(pkg.name)}
 catch(e){if(e.code!=='ENOENT') throw e}
}
names.sort();assert.equal(names.length,34)
const reportPath='site/test-results/release-site.json', out='site/out'
const requireEnv=key=>{assert.ok(process.env[key],key);return process.env[key]}
if(command==='preflight'){
 const runId=Number(requireEnv('FINAL_NPM_RECOVERY_RUN')),artifactId=Number(requireEnv('FINAL_NPM_RECOVERY_ARTIFACT_ID'))
 assert.ok([runId,artifactId].every(x=>Number.isSafeInteger(x)&&x>0))
 const expectedSHA=requireEnv('FINAL_NPM_RECOVERY_ARTIFACT_SHA256')
 assert.match(expectedSHA,/^[a-f0-9]{64}$/)
 const api='https://api.github.com/repos/'+repo
 const headers={Authorization:'Bearer '+requireEnv('GITHUB_TOKEN'),Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}
 const github=async path=>{const response=await fetch(api+path,{headers,redirect:'error',signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,path);return response.json()}
 const file=async (path,limit)=>{
  const response=await fetch(api+path,{headers,redirect:'manual',signal:AbortSignal.timeout(30000)})
  let download=response
  if(response.status===302){
   const address=new URL(response.headers.get('location'))
   assert.equal(address.protocol,'https:');assert.ok(!address.username&&!address.password)
   download=await fetch(address,{redirect:'error',signal:AbortSignal.timeout(180000)})
  }
  assert.equal(download.status,200,path)
  const blocks=[];let size=0
  for await (const block of download.body){size+=block.length;assert.ok(size<=limit);blocks.push(block)}
  return Buffer.concat(blocks)
 }
 const [workflow,run,artifact,jobPage,release,publicTag]=await Promise.all([
  github('/actions/workflows/release.yml'),github('/actions/runs/'+runId+'/attempts/1'),
  github('/actions/artifacts/'+artifactId),github('/actions/runs/'+runId+'/attempts/1/jobs?per_page=100'),
  github('/releases/tags/'+tag),github('/git/ref/tags/'+tag)])
 const request={repository:repo,repositoryId:repoId,runId,attempt:1,revision:source,branch:'main',version:'2.0.0',channel:'latest'}
 verifyRecoverySource(request,workflow,run,artifact)
 assert.equal(run.event,'workflow_dispatch');assert.equal(run.conclusion,'success')
 assert.equal(artifact.id,artifactId);assert.equal(artifact.digest,'sha256:'+expectedSHA)
 assert.equal(publicTag.object.type,'commit');assert.equal(publicTag.object.sha,source)
 assert.equal(release.tag_name,tag);assert.equal(release.draft,false);assert.equal(release.prerelease,false)
 assert.ok(release.assets.some(a=>a.name==='release-notes-v2.0.0.md'))
 assert.equal(jobPage.jobs.length,jobPage.total_count)
 const jobs=jobPage.jobs.filter(j=>j.name==='Recover the explicitly selected npm cohort')
 assert.equal(jobs.length,1)
 const job=jobs[0]
 assert.equal(job.run_id,runId);assert.equal(job.run_attempt,1);assert.equal(job.head_sha,source);assert.equal(job.conclusion,'success')
 assert.ok(job.steps.some(s=>s.name==='Resume verified npm uploads and promotion only'&&s.conclusion==='success'))
 assert.ok(job.steps.some(s=>s.name==='Preserve recovery evidence even after partial failure'&&s.conclusion==='success'))
 const [zip,log]=await Promise.all([file('/actions/artifacts/'+artifactId+'/zip',256*1024**2),file('/actions/jobs/'+job.id+'/logs',20*1024**2)])
 assert.equal(zip.length,artifact.size_in_bytes);assert.equal(sha256(zip),expectedSHA)
 assert.ok(log.toString('utf8').includes('Artifact ID is '+artifactId))
 const zipPath=join(requireEnv('RUNNER_TEMP'),'master-css-recovery-evidence-'+runId+'.zip')
 await writeFile(zipPath,zip,{flag:'wx',mode:0o600})
 execFileSync('python3',['-c',extractEvidencePython,zipPath,stateRoot],{stdio:['ignore','pipe','pipe']})
 const state=await verifyRestoredEvidence(stateRoot,request)
 assert.equal(state.run,originalRun)
 assertReleaseProvenanceProof(state)
 const registry=registryFromState(state,metadata,names)
 await verifyPublicRegistry(registry,metadata)
 for(let offset=0;offset<names.length;offset+=6){
  await Promise.all(names.slice(offset,offset+6).map(async name=>assert.equal((await readRegistryTags(name)).latest,'2.0.0',name)))
 }
 await writeFile(localReceipt,jsonBytes({runId,attempt:1,artifactId,artifactSha256:expectedSHA,ownerJobId:job.id,
  ownerLogSha256:sha256(log),stateSha256:sha256(await readFile(statePath)),source,githubReleaseId:release.id,registry,
  editorOrSitePublishPerformed:false}),{flag:'wx',mode:0o600})
 console.log('Verified the authenticated final npm recovery artifact and all 34 public latest tags.')
}else{
 const proof=JSON.parse(await readFile(localReceipt))
 assert.equal(proof.source,source);assert.equal(sha256(await readFile(statePath)),proof.stateSha256)
 if(command==='identity') await prepareIdentity(out,metadata)
 else {
  const manifest=await createManifest(out,metadata,await readFile(reportPath),proof.registry)
  await verifyOutput(out,manifest,metadata)
  await writeFile('release-artifacts/site.manifest.json',jsonBytes(manifest),{flag:'wx'})
  console.log('Verified '+manifest.files.length+' exact stable site files; no deployment performed.')
 }
}
