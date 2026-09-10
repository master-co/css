import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
assert(process.cwd().includes('master-css-bh-isolated-'))
const require=createRequire(resolve('package.json'))
const {chromium,firefox,webkit}=require('@playwright/test')
const {analyzeCSSStructure}=await import(pathToFileURL(resolve('shared/css-structure.ts')))
const element='<p id="probe" class="probe x"><span>test</span></p>'
const many='.x'.repeat(11)
const types=Array(11).fill('div').join(' ')
const cases=[
  {name:'universal',css:'p{color:blue}*{color:red}',html:element,score:1},
  {name:'namespace-universal',css:'@namespace h url(http://www.w3.org/1999/xhtml); p{color:blue}h|*{color:red}',html:element,score:1},
  {name:'is-id',css:':is(#probe){color:red}#probe{color:blue}',html:element,score:100},
  {name:'not-class',css:':not(.absent){color:red}.probe{color:blue}',html:element,score:10},
  {name:'has-type',css:':has(>span){color:red}p{color:blue}',html:element,score:1},
  {name:'where-zero',css:':where(#probe){color:red}*{color:blue}',html:element,score:0},
  {name:'uppercase-where',css:':WHERE(#probe){color:red}*{color:blue}',html:element,score:0},
  {name:'escaped-is',css:':i\\73(#probe){color:red}#probe{color:blue}',html:element,score:100},
  {name:'nth-of',css:':nth-child(1 of #probe){color:red}#probe.probe{color:blue}',html:element,score:110},
  {name:'nth-last-of',css:':nth-last-child(1 of #probe){color:red}#probe.probe{color:blue}',html:element,score:110},
  {name:'class-component-overflow',css:`:is(#absent,${many}){color:blue}${many}{color:red}`,html:element,score:100},
  {name:'type-component-overflow',css:`:is(.absent,${types}){color:blue}${types}{color:red}`,html:'<div>'.repeat(10)+'<div id="probe">test</div>'+'</div>'.repeat(10),score:10},
  {name:'explicit-nesting',css:'.x,#absent{&.x{color:blue}}.x.x{color:red}',html:element,score:110},
  {name:'implicit-nesting',css:'.x,#absent{.child{color:blue}}.x .child{color:red}',html:'<div class="x"><p id="probe" class="child">test</p></div>',score:110},
  {name:'repeated-parent',css:'.x{&&{color:blue}}.x{color:red}',html:element,score:20},
  {name:'parent-where',css:'#probe{color:blue;:where(&){color:red}}',html:element,score:100},
  {name:'scope-parent-reset',css:'#probe{@scope (&){&{color:red}}}#probe{color:blue}',html:element,score:100},
  {name:'legacy-pseudo-element',css:'p:before{content:"test";color:red}p::before{color:blue}',html:element,score:2,pseudo:'::before'},
  {name:'host-argument',css:':host(.x){color:blue}:host{color:red}',html:'<div id="probe" class="x"></div>',score:20,shadow:true},
  {name:'slotted-argument',css:'::slotted(.x){color:blue}::slotted(*){color:red}',html:'<div id="host"><p id="probe" class="x">test</p></div>',score:11,slot:true}
]
let total=0
const failures=[]
for(const [name,type] of Object.entries({chromium,firefox,webkit})) {
  const browser=await type.launch()
  try {
    const page=await browser.newPage()
    for(const control of cases) {
      const structure=analyzeCSSStructure(control.css)
      assert.equal(structure.maxSelectorSpecificityScore,control.score,control.name)
      await page.setContent(control.html)
      if(control.shadow||control.slot) {
        await page.evaluate(({css,slot})=>{
          const root=document.querySelector(slot?'#host':'#probe').attachShadow({mode:'open'})
          const style=document.createElement('style');style.textContent=css;root.append(style)
          if(slot)root.append(document.createElement('slot'))
        },{css:control.css,slot:!!control.slot})
      } else await page.addStyleTag({content:control.css})
      const color=await page.locator('#probe').evaluate((element,pseudo)=>getComputedStyle(element,pseudo).color,control.pseudo||null)
      const pass=color==='rgb(0, 0, 255)'
      if(!pass)failures.push({browser:name,control:control.name,color,css:control.css,cssom:await page.evaluate(()=>[...document.styleSheets].flatMap(sheet=>[...sheet.cssRules].map(rule=>rule.cssText)))})
      console.log(JSON.stringify({browser:name,version:browser.version(),control:control.name,color,score:control.score,tuple:structure.maxSelectorSpecificity,pass}));total++
    }
  }finally{await browser.close()}
}
console.log(JSON.stringify({browserControls:total,failures,pass:failures.length===0}))
assert.deepEqual(failures,[])
