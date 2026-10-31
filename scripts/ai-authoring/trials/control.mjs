import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, symlink } from 'node:fs/promises'
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
    await writeFile(join(root,'controls.json'),JSON.stringify(records,null,2))
    assert.ok(records.every(r=>r.passed===r.solved),'Every positive control must pass and every starter must fail')
  } finally {await browser.close();console.log(root)}
}
