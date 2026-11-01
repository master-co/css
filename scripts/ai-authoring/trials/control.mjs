import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { fixture } from './fixtures.mjs'
import { check } from './check.mjs'
import { tasks } from '../evaluate.mjs'
export const repository = fileURLToPath(new URL('../../../',import.meta.url))
export async function prepare(root, task, solved=false) {
  await mkdir(root,{recursive:true})
  await symlink(join(repository,'node_modules'),join(root,'node_modules'),'dir')
  const data=await fixture(task,repository,solved)
  for(const [file,contents] of Object.entries(data.files)) await writeFile(join(root,file),contents)
  await writeFile(join(root,'package.json'),JSON.stringify({name:'master-authoring-trial',private:true,type:'module',scripts:{build:'node build.mjs'}}))
  await writeFile(join(root,'build.mjs'),`import {execFileSync} from 'node:child_process';execFileSync(process.execPath,${JSON.stringify([join(repository,'packages/cli/dist/bin/index.js'),'generate','index.html','app.js','-o','output.css','-v','0','--strict'])},{stdio:'inherit'});`)
  return data
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const root=await mkdtemp(join(tmpdir(),'master-authoring-controls-'))
  const browser=await chromium.launch()
  const records=[]
  try {
    for(const task of tasks) for(const solved of [false,true]) {
      const work=join(root,task.id,solved?'solved':'starter')
      await prepare(work,task.id,solved)
      const result=await check(work,task.id,browser,repository,solved?'Retained native CSS and reset. Cascade needs review. font-size and font-weight collide. Before/after primary and secondary changed; static analysis has dynamic runtime limits.':'')
      const passed=result.functional&&result.styling&&result.accessibility&&result.browser==='passed'
      records.push({task:task.id,solved,passed,failed:result.checks.filter(c=>!c.pass)})
      console.log(JSON.stringify(records.at(-1)))
    }
    const variants = [
      {name:'nested-panel',task:'settings-card',valid:true,html:s=>s.replace('class="p-card r-lg','class="r-lg').replace('<h1','<div class="p-card"><h1').replace('</article>','</div></article>')},
      {name:'earlier-button',task:'settings-card',valid:true,html:s=>s.replace('<h1','<button type="button">Theme</button><h1')},
      {name:'shadow-focus',task:'settings-card',valid:true,css:s=>s.replace('outline:2px solid #a855f7;outline-offset:3px;','outline:none;box-shadow:0 0 0 3px #a855f7;')},
      {name:'no-tab-access',task:'settings-card',valid:false,html:s=>s.replace('id="name"','id="name" tabindex="-1"')},
      {name:'no-visible-focus',task:'settings-card',valid:false,css:s=>s.replace('outline:2px solid #a855f7;outline-offset:3px;','outline:none;box-shadow:none;')},
      {name:'flex-columns',task:'responsive-grid',valid:true,html:s=>s.replace('grid gap-sm grid-cols(3)@md','flex flex-col gap-sm'),css:s=>s+'\n@media (width >= 52rem) {#cards {flex-direction:row} #cards>article {flex:1}}'},
      {name:'wrong-gap-unit',task:'css-declarations',valid:false,html:s=>s.replace('(gap:1rem)','(gap:16px)')},
      {name:'single-quote-invalid-class',task:'settings-card',valid:false,html:s=>s.replace('class="p-card r-lg bg-surface fg-ink grid gap-sm"','class=\'p-card r-lg bg-surface fg-ink grid gap-sm not-a-master-utility\'')},
      {name:'renamed-progress-nodes',task:'dynamic-value',valid:true,html:s=>s.replace('id="progress"','id="upload"').replace('id="fill"','id="indicator"'),js:s=>s.replaceAll('#progress','#upload').replaceAll('#fill','#indicator')},
      {name:'unconditional-hover',task:'tailwind-hover',valid:false,failure:'touch-tap',css:s=>s+'\n#target:hover {background-color:var(--color-blue-700)}'},
    ]
    for(const variant of variants) {
      const work=join(root,variant.task,variant.name)
      await prepare(work,variant.task,true)
      for(const [file,transform] of [['index.html',variant.html],['app.css',variant.css],['app.js',variant.js]]) if(transform) await writeFile(join(work,file),transform(await readFile(join(work,file),'utf8')))
      const result=await check(work,variant.task,browser,repository,'Retained native CSS reset. Cascade needs review.')
      if(variant.failure) assert.ok(result.checks.some(c=>c.id===variant.failure&&!c.pass),`${variant.name} must expose ${variant.failure}`)
      records.push({task:variant.task+'-'+variant.name,solved:variant.valid,passed:result.functional&&result.styling&&result.accessibility&&result.browser==='passed',failed:result.checks.filter(c=>!c.pass)})
      console.log(JSON.stringify(records.at(-1)))
    }
    await writeFile(join(root,'controls.json'),JSON.stringify(records,null,2))
    assert.ok(records.every(r=>r.passed===r.solved),'Every positive control must pass and every starter must fail')
  } finally {await browser.close();console.log(root)}
}
