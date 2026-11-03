/** Isolated packed consumer fixtures; never add these routes to production. */
import assert from 'node:assert/strict'
import { mkdir,writeFile,readFile } from 'node:fs/promises'
import { resolve,join } from 'node:path'
import { auditStyles } from '@master/internal-site/build/style-delivery.mjs'
const [mode,directory]=process.argv.slice(2)
const cases={
 window:`import Window from '../../../components/HomeEditorWindow.svelte'\n---\n<Window>Content</Window>`,
 tab:`import Tab from '../../../components/HomeEditorTab.svelte'\n---\n<Tab>file.html</Tab>`,
 code:`import Code from '../../../components/HomeCodeWindow.astro'\n---\n<Code lang="html" code="<p>Hello</p>" />`,
 bento:`import Grid from '@master/internal-site/home/HomeBentoGrid.astro'\n---\n<Grid>Content</Grid>`,
 segmented:`import Control from '../../../components/HomeSegmentedControl.svelte'\n---\n<Control options={[{label:'A',value:'a'}]} value="a" onValueChange={() => {}} />`
}
if(mode==='write'){
 assert.match(resolve(directory),/^\/(?:private\/)?tmp\//)
 for(const [name,body]of Object.entries(cases)){
  const dir=join(directory,'content/examples/__home-window',name);await mkdir(dir,{recursive:true})
  await writeFile(join(dir,'page.astro'),`---\nexport const documentStyles = false\nimport '@master/internal-site/home/design.css'\n${body}\n`)
 }
}else if(mode==='verify'){
 const report=await auditStyles(directory)
 for(const name of Object.keys(cases)){
  const route=report.routes[`/examples/__home-window/${name}`];assert.ok(route,name)
  const css=(await Promise.all(route.assets.map(href=>readFile(join(directory,href),'utf8')))).join('\n')
  for(const token of ['.home-editor-picker','.home-lint-menu','.home-agent-transcript','.home-agent-pane','.home-editor-suggest'])assert.equal(css.includes(token),false,`${name}: ${token}`)
  assert.equal(css.includes('.home-window-surface'),name==='window',`${name}: outer material`)
  assert.equal(css.includes('.home-editor-tab'),name==='tab',`${name}: chrome`)
  assert.equal(css.includes('.home-bento-card'),name==='bento',`${name}: bento`)
  assert.equal(css.includes('.home-segmented-control'),name==='segmented',`${name}: segmented`)
  assert.equal(route.foundationCount,1)
 }
 console.log('Five isolated home feature boundaries passed')
}else throw new Error('Expected write or verify')
