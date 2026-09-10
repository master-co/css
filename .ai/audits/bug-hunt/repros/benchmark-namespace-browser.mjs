import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {resolve} from 'node:path'
assert(process.cwd().includes('master-css-bh-isolated-'))
const require=createRequire(resolve('package.json'))
const browsers=require('@playwright/test')
const prefix='@namespace h url(http://www.w3.org/1999/xhtml);'
const cases=[
 ['plain-universal','p{color:blue}*{color:red}','rgb(0, 0, 255)'],
 ['named-universal-after','p{color:blue}h|*{color:red}','rgb(0, 0, 255)'],
 ['named-universal-before','h|*{color:red}p{color:blue}','rgb(0, 0, 255)'],
 ['named-universal-tie','h|*{color:red}*{color:blue}','rgb(0, 0, 255)'],
 ['any-namespace-universal','p{color:blue}*|*{color:red}','rgb(0, 0, 255)'],
 ['named-type','h|p{color:blue}h|*{color:red}','rgb(0, 0, 255)'],
 ['plain-type-only','p{color:blue}','rgb(0, 0, 255)'],
 ['named-universal-only','h|*{color:red}','rgb(255, 0, 0)']
]
const rows=[]
for(const name of ['chromium','firefox','webkit']) {
 const browser=await browsers[name].launch()
 try {
  for(const [control,rules,expected] of cases) {
   const page=await browser.newPage()
   await page.setContent(`<style>${prefix+rules}</style><p id="probe">test</p>`)
   const color=await page.locator('#probe').evaluate(e=>getComputedStyle(e).color)
   const row={browser:name,version:browser.version(),control,color,expected,pass:color===expected}
   rows.push(row);console.log(JSON.stringify(row));await page.close()
  }
 }finally{await browser.close()}
}
console.log(JSON.stringify({controls:rows.length,normativeMismatches:rows.filter(row=>!row.pass),productOrAnalyzerLoaded:false}))
assert(rows.filter(row=>row.browser!=='webkit').every(row=>row.pass))
assert.deepEqual(rows.filter(row=>!row.pass).map(row=>`${row.browser}/${row.control}`),['webkit/named-universal-after','webkit/named-universal-tie','webkit/named-type'])
