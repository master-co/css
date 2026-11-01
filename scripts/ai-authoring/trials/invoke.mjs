import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const modelArguments=['exec','--ignore-user-config','--ephemeral','--skip-git-repo-check','--json','--disable','memories','--disable','multi_agent','--disable','plugins','--disable','apps','--enable','skip_host_skill_discovery','-c','skills.include_instructions=false','-c','project_doc_max_bytes=0','-c','web_search="disabled"','-c','model_reasoning_effort="low"','-c','approval_policy="never"','-s','workspace-write']

export async function invoke({work,model,prompt,folder,attempt,arm,common,cacheRoot,repository,timeoutMs}) {
  const config=[...common,'--add-dir',cacheRoot,'-C',work,'-m',model]
  if(arm.includes('mcp')) {
    config.push('-c',`mcp_servers.master.command=${JSON.stringify(process.execPath)}`,'-c',`mcp_servers.master.args=${JSON.stringify([join(repository,'packages/mcp/dist/bin/index.js'),'--root',work])}`,'-c','mcp_servers.master.required=true')
    if(arm!=='skill-mcp-bridge') config.push('-c','mcp_servers.master.disabled_tools=["mastercss_suggest_classes"]')
  }
  config.push('-')
  await writeFile(join(folder,`attempt-${attempt}.prompt.txt`),prompt)
  await writeFile(join(folder,`attempt-${attempt}.command.json`),JSON.stringify(config))
  const invokedAt=Date.now()
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
  const mcpCalls=events.filter(e=>e.type==='item.completed'&&e.item?.type==='mcp_tool_call')
  return {answer,usage,toolCalls,timedOut,exit,failed,unavailable,hostSkillRead,durationMs:Date.now()-invokedAt,
    mcpCalls:mcpCalls.length,mcpErrors:mcpCalls.filter(e=>e.item.error||e.item.status==='failed').length,
    mcpSuggestions:mcpCalls.filter(e=>e.item.tool==='mastercss_suggest_classes').length}
}

