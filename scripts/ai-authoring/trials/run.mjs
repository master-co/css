import { spawn, execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile, appendFile, cp, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { tmpdir, userInfo } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { tasks, arms, summarize } from '../evaluate.mjs'
import { prepare, repository } from './control.mjs'
import { check } from './check.mjs'

const args=process.argv.slice(2)
const option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback
const root=option('--resume',null) ? resolve(option('--resume')) : await mkdtemp(join(tmpdir(),'master-authoring-trials-'))
const limit=Number(option('--limit','240'))
const concurrency=Number(option('--concurrency','2'))
const timeoutMs=Number(option('--timeout-ms','120000'))
for(const [name,value] of Object.entries({limit,concurrency,timeoutMs})) if(!Number.isSafeInteger(value)||value<1) throw new Error(`Invalid ${name}`)
const models=['gpt-6.1-sol','gpt-6-luna']
const baselineInstructions=execFileSync('git',['show','85f210253:packages/create/src/constants.ts'],{cwd:repository,encoding:'utf8'}).split('export const AGENT_RULES_BLOCK = `')[1].split('`')[0]
const clientVersion=execFileSync('codex',['--version'],{encoding:'utf8'}).trim()
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim()
const digest=x=>createHash('sha256').update(x).digest('hex')
const toolVersion=digest(await readFile(join(repository,'packages/binding/artifacts/mastercss.node')))
const corpusHash=digest(await readFile(new URL('fixtures.mjs',import.meta.url)))
const harnessHashes=Object.fromEntries(await Promise.all(['run.mjs','fixtures.mjs','check.mjs','control.mjs'].map(async file=>[file,digest(await readFile(new URL(file,import.meta.url)))])))
const tailwindVersion=JSON.parse(await readFile(join(repository,'node_modules/tailwindcss/package.json'),'utf8')).version
const skillRoot=join(repository,'skills/master-css')
const artifactHashes=Object.fromEntries(await Promise.all(['bun.lock','packages/mcp/dist/bin/index.js','packages/cli/dist/bin/index.js','skills/master-css/SKILL.md','skills/master-css/references/authoring.md','skills/master-css/references/importing.md','skills/master-css/references/troubleshooting.md'].map(async file=>[file,digest(await readFile(join(repository,file)))])))
const cacheRoot=join(userInfo().homedir,'.cache/mastercss')
await mkdir(cacheRoot,{recursive:true})
const common=['exec','--ignore-user-config','--ephemeral','--skip-git-repo-check','--json','--disable','memories','--disable','multi_agent','--disable','plugins','--disable','apps','--enable','skip_host_skill_discovery','-c','skills.include_instructions=false','-c','project_doc_max_bytes=0','-c','web_search="disabled"','-c','model_reasoning_effort="low"','-c','approval_policy="never"','-s','workspace-write']
const protocol={version:1,revision,corpusHash,harnessHashes,artifactHashes,toolVersion,clientVersion,tailwindVersion,models,reasoning:'low',repeats:2,arms,tasks:tasks.map(t=>t.id),timeoutMs,maxRepairRounds:2,concurrency,
  modelRevisionLimit:'These are recorded service model identifiers. The service does not expose immutable weight revision IDs in exec output.',
  isolation:'Fresh CLI session and directory per trial. Automatic skill instructions/catalog, host skill discovery, plugins, apps, memory and web search disabled; baseline instructions supplied explicitly. Skill arms receive the project skill with an explicit path, so this tests instruction use, not autonomous skill discovery. Filesystem isolation permits dependency reads; this is not a security boundary against access to other local files.',
  scoring:'Frozen deterministic browser and source checks; no LLM judge. Not a full visual-design or accessibility review.',
  commonArgs:common,baselineInstructions,startedAt:new Date().toISOString()}
if(args.includes('--resume')) {
  const old=JSON.parse(await readFile(join(root,'protocol.json'),'utf8'))
  for(const field of ['revision','corpusHash','toolVersion','clientVersion','timeoutMs']) if(old[field]!==protocol[field]) throw new Error(`Cannot resume changed ${field}`)
  if(JSON.stringify(old.harnessHashes)!==JSON.stringify(harnessHashes)) throw new Error('Cannot resume changed evaluator or runner')
  if(JSON.stringify(old.artifactHashes)!==JSON.stringify(artifactHashes)) throw new Error('Cannot resume changed tools or skill')
} else await writeFile(join(root,'protocol.json'),JSON.stringify(protocol,null,2),{flag:'wx'})
console.log(JSON.stringify({root,protocol:{models,attempts:240,concurrency,timeoutMs}}))
const browser=await chromium.launch()
let completed=0
let infrastructureFailure=null
const observations=[]
for(const file of await readdir(root)) if(file.endsWith('.result.json')) observations.push(JSON.parse(await readFile(join(root,file),'utf8')))
const done=new Set(observations.map(r=>`${r.task}-${r.arm}-${r.model}-${r.repeat}`))
// Interleave all arms/models within each task/repetition to limit time-order bias.
const trials=[]
for(let repeat=0;repeat<2;repeat++) for(const task of tasks) for(const arm of arms) for(const model of models) {
  const id=`${task.id}-${arm}-${model}-${repeat}`
  if(!done.has(id)) trials.push({id,task,arm,model,repeat})
}

async function invoke(work,model,prompt,folder,attempt,arm) {
  const config=[...common,'--add-dir',cacheRoot,'-C',work,'-m',model]
  if(arm.includes('mcp')) {
    config.push('-c',`mcp_servers.master.command=${JSON.stringify(process.execPath)}`,'-c',`mcp_servers.master.args=${JSON.stringify([join(repository,'packages/mcp/dist/bin/index.js'),'--root',work])}`,'-c','mcp_servers.master.required=true')
    if(arm!=='skill-mcp-bridge') config.push('-c','mcp_servers.master.disabled_tools=["mastercss_suggest_classes"]')
  }
  config.push('-')
  await writeFile(join(folder,`attempt-${attempt}.prompt.txt`),prompt)
  await writeFile(join(folder,`attempt-${attempt}.command.json`),JSON.stringify(config))
  const child=spawn('codex',config,{stdio:['pipe','pipe','pipe'],detached:true})
  let stdout='',stderr='',timedOut=false
  child.stdout.on('data',chunk=>{stdout+=chunk})
  child.stderr.on('data',chunk=>{stderr+=chunk})
  child.stdin.end(prompt)
  let killTimer
  const timer=setTimeout(()=>{timedOut=true;try{process.kill(-child.pid,'SIGTERM')}catch{};killTimer=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL')}catch{}},5000)},timeoutMs)
  const exit=await new Promise(resolve=>{child.on('error',error=>resolve({error:error.message}));child.on('close',(code,signal)=>resolve({code,signal}))})
  clearTimeout(timer)
  clearTimeout(killTimer)
  await writeFile(join(folder,`attempt-${attempt}.events.jsonl`),stdout)
  await writeFile(join(folder,`attempt-${attempt}.stderr.log`),stderr)
  const events=stdout.split('\n').filter(Boolean).flatMap(line=>{try{return [JSON.parse(line)]}catch{return []}})
  const answer=events.filter(e=>e.type==='item.completed'&&e.item?.type==='agent_message').map(e=>e.item.text).join('\n')
  const usage=events.findLast(e=>e.type==='turn.completed')?.usage
  const toolCalls=events.filter(e=>e.type==='item.completed'&&['command_execution','mcp_tool_call','web_search','file_change'].includes(e.item?.type)).length
  const failed=timedOut||exit.code!==0||events.some(e=>e.type==='turn.failed')
  const unavailable=failed&&/usage.limit|insufficient.quota|rate.limit.exceeded|authentication|unauthorized|failed to initialize|requires login/i.test(stdout+'\n'+stderr)
  const hostSkillRead=events.some(e=>e.type==='item.completed'&&e.item?.type==='command_execution'&&/\/(?:\.codex|\.agents)\/skills\//.test(e.item.command??'')&&!e.item.command.includes(work+'/.agents/skills/'))
  return {answer,usage,toolCalls,timedOut,exit,failed,unavailable,hostSkillRead}
}

async function trial({id,task,arm,model,repeat}) {
  const folder=join(root,id),work=join(folder,'work')
  await mkdir(folder,{recursive:true})
  const data=await prepare(work,task.id)
  const baseline=join(folder,'baseline')
  await mkdir(baseline)
  for(const [name,contents] of Object.entries(data.files)) await writeFile(join(baseline,name),contents)
  if(arm.includes('skill')) await cp(skillRoot,join(work,'.agents/skills/master-css'),{recursive:true})
  const protectedFiles=['build.mjs','package.json',...Object.keys(data.files).filter(name=>name.startsWith('source'))]
  const hashes=Object.fromEntries(await Promise.all(protectedFiles.map(async name=>[name,digest(await readFile(join(work,name)))])))
  const prompt=`${baselineInstructions}\n\nTASK: ${task.prompt}\n${data.detail}\n\nEdit only index.html, app.css and app.js. Do not read other trials, evaluator sources or solutions. Do not read global/personal skills; only a project skill explicitly supplied below is available. Do not edit build.mjs, source baseline files, or package.json. No new dependencies or network fetches. Build with node build.mjs. Do not invoke other agents/models. Work within this directory. Use the declaration-to-class suggestion bridge only if exposed by the connected MCP server; do not invoke an equivalent programmatic API otherwise. Finish with the actual changes, checks and limitations. You have ${timeoutMs/1000} seconds per attempt.\n${arm.includes('skill')?'Project skill available: read .agents/skills/master-css/SKILL.md and only the relevant referenced files.':''}\n${arm.includes('mcp')?'The project Master CSS MCP server is connected. Verify its root and use its available tools when useful.':'Use the installed tools; no Master CSS MCP server is connected for this trial.'}`
  const started=Date.now(),attempts=[]
  let verdict,repairRounds=0
  for(let attempt=0;attempt<=2;attempt++) {
    repairRounds=attempt
    const feedback=attempt?`\n\nIndependent checks failed: ${JSON.stringify(verdict.checks.filter(c=>!c.pass))}. Repair the files; preserve unrelated behavior.`:''
    const run=await invoke(work,model,prompt+feedback,folder,attempt,arm)
    if(run.unavailable||run.hostSkillRead) infrastructureFailure={id,attempt,reason:run.hostSkillRead?'Unexpected personal skill access':'Model service or MCP unavailable'}
    attempts.push(run)
    try {verdict=await check(work,task.id,browser,repository,run.answer,baseline)}
    catch(error) {verdict={functional:false,styling:false,accessibility:false,browser:'not-checked',invalidClasses:null,checks:[{id:'checker-error',pass:false,actual:error.message}]}}
    for(const name of protectedFiles) {
      let hash=null
      try{hash=digest(await readFile(join(work,name)))}catch{}
      if(hash!==hashes[name]) {verdict.functional=false;verdict.checks.push({id:'protected-file-changed',pass:false,actual:name})}
    }
    if(run.hostSkillRead) {verdict.functional=false;verdict.checks.push({id:'personal-skill-contamination',pass:false})}
    await writeFile(join(folder,`attempt-${attempt}.acceptance.json`),JSON.stringify(verdict,null,2))
    if(run.failed||run.hostSkillRead||verdict.functional&&verdict.styling&&verdict.accessibility&&verdict.browser==='passed') break
  }
  const measured=attempts.every(a=>a.usage)
  const result={task:task.id,arm,model,client:clientVersion,fixtureRevision:revision+':'+corpusHash,toolVersion,repeat,repairRounds,
    invalidClasses:verdict.invalidClasses,toolCalls:attempts.reduce((n,a)=>n+a.toolCalls,0),
    inputTokens:measured?attempts.reduce((n,a)=>n+a.usage.input_tokens,0):null,
    outputTokens:measured?attempts.reduce((n,a)=>n+a.usage.output_tokens,0):null,
    durationMs:Date.now()-started,functional:verdict.functional&&!attempts.at(-1).failed,styling:verdict.styling,accessibility:verdict.accessibility,browser:verdict.browser,
    execution:attempts.map(a=>({exit:a.exit,timedOut:a.timedOut,unavailable:a.unavailable,hostSkillRead:a.hostSkillRead})),firstAttemptPassed:attempts.length===1&&!attempts[0].failed&&verdict.functional&&verdict.styling&&verdict.accessibility&&verdict.browser==='passed',artifacts:folder}
  await writeFile(join(root,`${id}.result.json`),JSON.stringify(result,null,2),{flag:'wx'})
  observations.push(result)
  await appendFile(join(root,'observations.jsonl'),JSON.stringify(result)+'\n')
  completed++
  console.log(JSON.stringify({completed,total:Math.min(limit,trials.length),id,passed:result.functional&&result.styling&&result.accessibility&&result.browser==='passed',repairRounds,durationMs:result.durationMs}))
}
try {
  let next=0
  await Promise.all(Array.from({length:concurrency},async()=>{while(!infrastructureFailure&&next<Math.min(limit,trials.length)){const index=next++;await trial(trials[index])}}))
} finally {
  await browser.close()
  await writeFile(join(root,'summary.json'),JSON.stringify(summarize(observations),null,2))
  console.log(JSON.stringify({root,completed,totalObserved:observations.length}))
  if(infrastructureFailure) {await writeFile(join(root,'blocked.json'),JSON.stringify(infrastructureFailure,null,2));process.exitCode=1;console.error(JSON.stringify(infrastructureFailure))}
}
