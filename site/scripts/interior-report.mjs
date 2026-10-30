/** Turn retained browser evidence into an inspectable comparison and link audit. */
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fg from 'fast-glob'

const directory = fileURLToPath(new URL('../test-results/interior-redesign/', import.meta.url))
const labels = ['baseline-production', 'redesign-production']
const inventory = JSON.parse(await readFile(path.join(directory, 'inventory.json'), 'utf8'))
const failures = []
const summaries = []
const snapshots = new Map()
for (const label of labels) {
  const files = await fg(`${label}/{chromium,webkit}/**/*.json`, { cwd: directory })
  const records = await Promise.all(files.map(async file => ({ file, ...JSON.parse(await readFile(path.join(directory, file), 'utf8')) })))
  summaries.push({ label, cases: records.length, routes: new Set(records.map(record => record.pathname)).size, engines: [...new Set(records.map(record => record.engine))], widths: [...new Set(records.map(record => record.width))].sort((a, b) => a - b), schemes: [...new Set(records.map(record => record.scheme))] })
  for (const record of records) {
    snapshots.set([label, record.pathname, record.engine, record.width, record.scheme].join('|'), record)
    const issues = []
    if (record.failure) issues.push(record.failure)
    if (record.status !== undefined && record.status !== record.expectedStatus) issues.push(`HTTP ${record.status}, expected ${record.expectedStatus}`)
    if (record.metrics?.overflow) issues.push('Horizontal page overflow')
    if (record.section !== 'examples' && !record.metrics?.headings?.length) issues.push('No page heading')
    issues.push(...(record.errors ?? []), ...(record.metrics?.brokenImages ?? []).map(src => `Broken image: ${src}`))
    if (issues.length) failures.push({ label, pathname: record.pathname, engine: record.engine, width: record.width, scheme: record.scheme, issues, evidence: record.file })
  }
}

const missingLinks = []
for (const label of labels) {
  const pages = new Map(inventory.routes.map(route => [route.pathname, snapshots.get([label, route.pathname, 'chromium', 1440, 'light'].join('|'))]))
  for (const [pathname, record] of pages) {
    for (const link of record?.metrics?.links ?? []) {
      if (!link.href || /^(?:https?:|mailto:|tel:|data:)/.test(link.href)) continue
      const target = new URL(link.href, `https://interior-review.invalid${pathname}`)
      const route = target.pathname.replace(/\/$/, '') || '/'
      if (path.extname(route)) continue
      const hash = decodeURIComponent(target.hash.slice(1))
      if (!pages.has(route)) missingLinks.push({ label, pathname, href: link.href, text: link.text, issue: 'Unknown local route' })
      else if (hash && pages.get(route)?.metrics?.ids && !pages.get(route).metrics.ids.includes(hash)) missingLinks.push({ label, pathname, href: link.href, text: link.text, issue: 'Missing anchor; inspect for intentional specimen links' })
    }
  }
}

const documentGeometry = []
const homeStyles = []
for (const route of inventory.routes) for (const engine of ['chromium', 'webkit']) for (const width of [320, 390, 768, 1280, 1440]) for (const scheme of ['light', 'dark']) {
  const before = snapshots.get([labels[0], route.pathname, engine, width, scheme].join('|'))
  const after = snapshots.get([labels[1], route.pathname, engine, width, scheme].join('|'))
  if (!before?.metrics || !after?.metrics) continue
  if (['guide', 'reference'].includes(route.section)) {
    for (const key of ['article', 'sidebar', 'contents']) {
      const geometry = value => value && ({ x: value.x, width: value.width, paddingInlineStart: value.paddingInlineStart, paddingInlineEnd: value.paddingInlineEnd })
      const original = geometry(before.metrics.columns[key]); const current = geometry(after.metrics.columns[key])
      if (JSON.stringify(original) !== JSON.stringify(current)) documentGeometry.push({ pathname: route.pathname, engine, width, scheme, column: key, before: original, after: current })
    }
  }
  if (route.section === 'home') homeStyles.push({ pathname: route.pathname, engine, width, scheme, identical: JSON.stringify(before.metrics.homeStyles) === JSON.stringify(after.metrics.homeStyles), before: before.file, after: after.file })
}

const report = { generatedAt: new Date().toISOString(), summaries, failures, missingLinks, documentGeometry, homeStyles }
await writeFile(path.join(directory, 'review-report.json'), JSON.stringify(report, null, 2) + '\n')
const routeOptions = inventory.routes.map(route => `<option value="${route.pathname}">${route.pathname}</option>`).join('')
const keys = Object.fromEntries(inventory.routes.map(route => [route.pathname, `${route.section}-${createHash('sha256').update(route.pathname).digest('hex').slice(0, 14)}`]))
const html = `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Master CSS 內頁前後對照</title>
<style>html{color-scheme:light dark;font:14px/1.6 system-ui}body{margin:0;background:light-dark(#f5f5f6,#151515);color:light-dark(#222,#eee)}header{position:sticky;top:0;z-index:2;padding:16px 24px;border-bottom:1px solid #8885;background:light-dark(#fff,#222)}h1{font-size:18px;margin:0 0 8px}p{margin:0 0 12px;color:light-dark(#555,#bbb)}form{display:flex;gap:12px;flex-wrap:wrap;align-items:end}label{display:grid;gap:4px}select{min-height:44px;max-width:100%;padding:8px;border:1px solid #888;border-radius:8px;background:transparent;color:inherit;font:inherit}label:first-child{flex:1;min-width:220px}main{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:24px}section{min-width:0}h2{font-size:14px;font-weight:550;margin:0}figure{margin:12px 0;overflow:auto;max-height:80vh;border:1px solid #8885;background:#8881}img{display:block;width:100%;height:auto}a{color:inherit;text-underline-offset:3px}summary{cursor:pointer;min-height:44px}details{padding:0 24px 24px}pre{overflow:auto;max-height:45vh;font-size:12px}small{color:light-dark(#555,#bbb)}@media(max-width:700px){main{grid-template-columns:1fr;padding:16px;gap:24px}header{position:static;padding:16px}}</style>
<header><h1>Master CSS 品牌與內頁精修 · 前後對照</h1><p>原版以 rc 已提交狀態建立。左右使用相同瀏覽器、寬度、色彩模式；檢查記錄會列出缺漏與例外。圖片依可用寬度縮放，可開啟原圖檢查實際尺寸。</p><form><label>頁面<select id="route">${routeOptions}</select></label><label>瀏覽器<select id="engine"><option>chromium</option><option>webkit</option></select></label><label>寬度<select id="width">${[390,768,1280,1440,320].map(width=>`<option>${width}</option>`).join('')}</select></label><label>模式<select id="scheme"><option>light</option><option>dark</option></select></label><label>截圖<select id="extent"><option value="">首屏</option><option value="-full">整頁（390 / 1440）</option></select></label></form></header>
<main>${labels.map((label,index)=>`<section><h2>${index ? '精修後' : '原版 rc'}</h2><small id="${label}-status">等待載入</small><figure><a id="${label}-link" target="_blank"><img id="${label}-image" alt="${index ? '精修後' : '原版'}頁面截圖"></a></figure><a id="${label}-record" target="_blank">檢查記錄</a></section>`).join('')}</main>
<details><summary>檢查概況與待確認項目</summary><pre id="report"></pre></details>
<script>
const labels=${JSON.stringify(labels)},keys=${JSON.stringify(keys)};
const form=document.querySelector('form');let request=0;
async function update(){
  const pending=++request,route=document.querySelector('#route').value,engine=document.querySelector('#engine').value,width=document.querySelector('#width').value,scheme=document.querySelector('#scheme').value;
  const extent=document.querySelector('#extent'),supportsFull=['390','1440'].includes(width);
  extent.options[1].disabled=!supportsFull;if(!supportsFull)extent.value='';
  const full=Boolean(extent.value);
  history.replaceState(null,'','?'+new URLSearchParams({engine,width,scheme,extent:full?'full':'viewport'})+'#'+encodeURIComponent(route));
  await Promise.all(labels.map(async label=>{
    const base=label+'/'+engine+'/'+width+'-'+scheme+'/'+keys[route],img=document.getElementById(label+'-image'),status=document.getElementById(label+'-status'),link=document.getElementById(label+'-link');
    status.textContent='正在讀取檢查記錄…';
    try{
      const response=await fetch(base+'.json');if(!response.ok)throw new Error('Missing record');
      const record=await response.json();if(request!==pending)return;
      const image=full&&record.fullImage?record.fullImage:record.image;
      if(!image)throw new Error('Missing image');
      const directory=base.slice(0,base.lastIndexOf('/')+1);
      status.textContent=width+'px / '+engine+' / '+scheme+(full&&!record.fullImage?' · 此頁保留首屏，整頁超過截圖範圍':'')+' · '+new Date(record.capturedAt).toLocaleString('zh-TW');
      img.onerror=()=>{if(request===pending)status.textContent='截圖無法讀取，請查看檢查記錄。'};
      img.src=directory+image;link.href=img.src;document.getElementById(label+'-record').href=base+'.json';
    }catch{if(request===pending)status.textContent='此截圖尚未產生，請查看巡檢進度。'}
  }));
}
form.addEventListener('change',update);
const selected=decodeURIComponent(location.hash.slice(1)),parameters=new URLSearchParams(location.search);
document.querySelector('#route').value=keys[selected]?selected:'/brand';
for(const key of ['engine','width','scheme']){const select=document.querySelector('#'+key),value=parameters.get(key);if([...select.options].some(option=>option.value===value))select.value=value}
if(parameters.get('extent')==='full')document.querySelector('#extent').value='-full';
update();fetch('review-report.json').then(response=>response.json()).then(report=>document.querySelector('#report').textContent=JSON.stringify(report,null,2));
</script></html>`
await writeFile(path.join(directory, 'index.html'), html)
console.log(JSON.stringify({ summaries, failures: failures.length, missingLinks: missingLinks.length, geometryDifferences: documentGeometry.length, homepageComparisons: homeStyles.length }))
