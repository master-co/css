import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { loadProjectManifest } from '@master/css-compiler/project'
import { inspectPageClasses, compareStyleEvidence } from '../browser-diagnostics.mjs'
import { compareColors, colorComparisonPolicy } from '../color-comparison.mjs'

export async function check(root, task, browser, repository, answer = '', baselineRoot = root, { includeDiagnostics = true } = {}) {
  const checks = []
  let classDiagnostics = null
  const diagnosticRequests = []
  const importSamples = []
  const add = (kind, id, pass, actual) => checks.push({ kind, id, pass: Boolean(pass), actual })
  let invalidClasses = null, buildError = null, masterClasses = [], manifest = null
  const html = readFileSync(join(root, 'index.html'), 'utf8')
  const css = readFileSync(join(root, 'app.css'), 'utf8')
  const script = readFileSync(join(root, 'app.js'), 'utf8')
  const source = (html + '\n' + css + '\n' + script).replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, '')
  try {
    execFileSync(process.execPath, [join(repository, 'packages/cli/dist/bin/index.js'), 'generate', 'index.html', 'app.js', '-o', 'output.css', '-v', '0', '--strict'], { cwd: root, timeout: 30000, stdio: 'pipe' })
    manifest = await loadProjectManifest({ root, entries: [join(root, 'app.css')], baseManifest: { version:6, languageVersion:18 } })
  } catch (error) {
    buildError = String(error.stderr ?? error.message).slice(-5000)
    add('styling', 'build', false, buildError)
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } })
  const page = await context.newPage()
  page.setDefaultTimeout(1500)
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const style = (selector, name) => page.locator(selector).first().evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), name)
  try {
    await page.goto(pathToFileURL(join(root, 'index.html')).href)
    if(manifest) {
      classDiagnostics = await inspectPageClasses(page, manifest)
      masterClasses = classDiagnostics.classes.filter(item => item.status === 'generated').map(item => item.className)
      const invalid = classDiagnostics.unresolved.map(item => item.className)
      invalidClasses = invalid.length
      add('styling', 'valid-classes', invalid.length === 0, invalid)
    }
    const cardTasks = ['settings-card', 'density-edit', 'dark-theme', 'missing-css', 'tailwind-card']
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      add('styling', `overflow-${width}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      if (cardTasks.includes(task)) {
        add('functional', `content-${width}`, (await page.locator('h1').textContent())?.trim() === 'Account settings')
        const inset = await page.locator('#card').evaluate(el => {
          const card = el.getBoundingClientRect(), heading = el.querySelector('h1').getBoundingClientRect()
          return Math.min(heading.top-card.top,heading.left-card.left)
        })
        add('styling', `content-inset-${width}`, task === 'density-edit' ? inset >= 8 && inset < 24 : inset >= 16, inset)
      }
      await page.screenshot({ path: join(root, `review-${width}.png`) })
    }
    if (cardTasks.includes(task)) {
      add('accessibility', 'input-label', await page.locator('#name').evaluate(el => el.labels.length > 0))
      add('functional', 'name-value', await page.locator('#name').inputValue() === 'Aron')
      add('functional', 'button-content', (await page.locator('#save').textContent())?.trim() === 'Save changes' && (await page.locator('#locked').textContent())?.trim() === 'Managed by team')
      if(task !== 'tailwind-card') {
        add('accessibility', 'checkbox-label', await page.locator('#updates').evaluate(el => el.type === 'checkbox' && el.labels.length > 0))
        await page.locator('#updates').check()
        add('functional', 'checkbox-interaction', await page.locator('#updates').isChecked())
      }
      await page.locator('#save').click()
      add('functional', 'save-action', (await page.locator('#status').textContent()) === 'Saved')
      add('accessibility', 'disabled', await page.locator('#locked').isDisabled())
      await page.goto(pathToFileURL(join(root, 'index.html')).href)
      const focusStyles = () => page.locator('#name').evaluate(el => {
        const css=getComputedStyle(el)
        return [css.boxShadow,css.borderColor,css.backgroundColor]
      })
      const blurred = await focusStyles()
      const stops = Math.min(100,await page.locator('a[href],button,input,select,textarea,[tabindex]').count()+1)
      let reached = false
      for(let i=0;i<stops&&!reached;i++) {
        await page.keyboard.press('Tab')
        reached=await page.locator('#name').evaluate(el => el === document.activeElement)
      }
      const outline = await page.locator('#name').evaluate(el => {
        const css=getComputedStyle(el)
        return el.matches(':focus-visible') && css.outlineStyle!=='none' && parseFloat(css.outlineWidth)>0 && !['transparent','rgba(0, 0, 0, 0)'].includes(css.outlineColor)
      })
      add('accessibility', 'keyboard-focus', reached&&(outline||JSON.stringify(blurred)!==JSON.stringify(await focusStyles())))
      if (task === 'settings-card') add('styling', 'product-tokens', /(?:bg-brand|bg-surface|p-card|var\(--(?:color-brand|color-surface|spacing-card)\))/.test(html + css))
      if (task === 'missing-css') add('functional', 'delivery-fixed', /href=["']\.\/output\.css/.test(html))
      if (task === 'density-edit') add('styling', 'compact-gap', parseFloat(await style('#card', 'row-gap')) < 12)
      if (task === 'dark-theme') {
        const colors = []
        for (const theme of ['light', 'dark']) {
          await page.evaluate(theme => window.setTheme(theme), theme)
          const color = await style('#card', 'background-color')
          colors.push(color)
          const contrast = await page.locator('#card').evaluate(el => {
            const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
            const rgb = value => { ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3) }
            const l = rgb => rgb.map(v => v/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((n,v,i) => n+v*[.2126,.7152,.0722][i],0)
            const a=l(rgb(getComputedStyle(el).color)),b=l(rgb(getComputedStyle(el).backgroundColor))
            return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)
          })
          add('accessibility', `contrast-${theme}`, contrast >= 4.5, contrast)
        }
        add('styling', 'dark-activation', colors[0] !== colors[1], colors)
      }
    }
    if (task === 'responsive-grid') for (const width of [831, 833]) {
      await page.setViewportSize({ width, height: 900 })
      const layout = await page.locator('#cards>article').evaluateAll(elements => {
        const boxes=elements.map(el=>el.getBoundingClientRect())
        return {count:boxes.length,columns:new Set(boxes.map(b=>Math.round(b.left))).size,rows:new Set(boxes.map(b=>Math.round(b.top))).size,visible:boxes.every(b=>b.width>0&&b.height>0)}
      })
      add('styling', `columns-${width}`, layout.visible&&layout.count===3&&layout.columns===(width<832?1:3)&&layout.rows===(width<832?3:1), layout)
    }
    if (task === 'css-declarations') {
      for (const [property, expected] of Object.entries({ display:'flex','align-items':'center','padding-top':'16px',gap:'16px' })) add('styling', property, await style('#target', property) === expected)
      await page.evaluate(()=>document.documentElement.style.fontSize='20px')
      add('styling', 'unit-semantics', await style('#target','padding-top')==='16px'&&await style('#target','gap')==='20px')
      add('functional', 'uses-classes', Boolean(await page.locator('#target').getAttribute('class')) && !await page.locator('#target').getAttribute('style'))
      add('functional', 'cascade-limit-reported', /cascade/i.test(answer))
    }
    if (task === 'fallback-order') {
      add('styling', 'fallback-order', /display\s*:\s*block\s*;\s*display\s*:\s*grid/.test(source))
      add('styling', 'padding-order', /padding\s*:\s*1rem\s*;\s*padding-left\s*:\s*0/.test(source))
      add('styling', 'padding-left', await style('#target','padding-left') === '0px')
      add('styling', 'fallback-display', await style('#target','display') === 'grid')
      add('functional', 'retained-css-explained', /CSS|native|retain/i.test(answer))
    }
    if (task === 'token-collision') {
      add('styling', 'target-size', await style('#target','font-size') === '24px')
      add('styling', 'target-weight', await style('#target','font-weight') === '400')
      add('functional', 'control-unchanged', await style('#control','font-size') === '16px')
      add('functional', 'collision-explained', /font-size/.test(answer) && /font-weight/.test(answer))
    }
    if (task === 'dynamic-value') for (const value of [0,50,100]) {
      await page.evaluate(value => window.setProgress(value), value)
      const progress=page.getByRole('progressbar')
      const fillWidth=await progress.locator(':scope > *').first().evaluate(el=>parseFloat(getComputedStyle(el).width))
      const aria=await progress.getAttribute('aria-valuenow')
      const trackWidth=await progress.evaluate(el=>getComputedStyle(el).width)
      add('styling', `progress-${value}`, Math.abs(fillWidth-value*2)<.1, fillWidth)
      add('accessibility', `aria-${value}`, aria===String(value), aria)
      add('functional', `track-${value}`, trackWidth==='200px', trackWidth)
    }
    if (task === 'review-second-change') {
      for (const id of ['primary','secondary']) add('styling', id, await style(`#${id}`,'background-color') === 'rgb(124, 58, 237)')
      add('functional', 'independent-token', await style('#information','background-color') === 'rgb(37, 99, 235)')
      add('functional', 'consumers-reported', /primary/i.test(answer) && /secondary/i.test(answer))
      add('functional', 'impact-limits', /dynamic|static|runtime/i.test(answer))
    }
    if (task.startsWith('tailwind-')) {
      add('functional', 'master-output-linked', /href=["']\.\/output\.css/.test(html))
      add('functional', 'source-stylesheet-detached', !/source-tailwind\.css/.test(html + css))
      add('functional', 'retained-css-reported', /retain|reset|preflight/i.test(answer))
      const originalClasses = new Set([...readFileSync(join(baselineRoot,'source.html'),'utf8').matchAll(/class="([^"]*)"/g)].flatMap(m=>m[1].split(/\s+/)))
      add('functional', 'some-utilities-migrated', masterClasses.some(name=>!originalClasses.has(name)))
      const original = await context.newPage()
      const snapshot = p => p.locator('main').evaluate(el => [...el.querySelectorAll('*')].map(el => {
        const css=getComputedStyle(el)
        return Object.fromEntries(['width','height','padding-top','padding-right','font-size','line-height','font-weight','color','background-color','border-top-width','border-top-left-radius','opacity','outline-style','outline-width','outline-color','outline-offset'].map(key => [key,css.getPropertyValue(key)]))
      }))
      for (const scheme of ['light','dark']) for (const width of [390,1280]) {
        await page.emulateMedia({colorScheme:scheme});await original.emulateMedia({colorScheme:scheme})
        await page.setViewportSize({ width,height:900 });await original.setViewportSize({ width,height:900 })
        await original.goto(pathToFileURL(join(baselineRoot,'source.html')).href)
        await page.goto(pathToFileURL(join(root,'index.html')).href)
        for (const state of task === 'tailwind-hover' ? ['rest','hover','focus','disabled'] : ['rest']) {
          for (const p of [page,original]) {
            await p.mouse.move(0,0)
            if(state==='hover') await p.locator('#target').hover()
            if(state==='focus') await p.keyboard.press('Tab')
            if(state==='disabled') await p.locator('#target').evaluate(el=>{el.disabled=true})
          }
          const actual = await snapshot(page), expected = await snapshot(original)
          add('styling', `${scheme}-${width}-${state}`, JSON.stringify(actual) === JSON.stringify(expected), actual.flatMap((node,i)=>Object.keys(node).filter(k=>node[k]!==expected[i]?.[k]).map(k=>({node:i,property:k,actual:node[k],expected:expected[i]?.[k]}))))
          importSamples.push({ check: checks.at(-1), sameNodeCount: actual.length === expected.length, width, colorScheme: scheme, state })
        }
      }
      if(task==='tailwind-hover') {
        add('styling', 'hover-capability-retained', /hover\s*:\s*hover/.test(readFileSync(join(root,'output.css'),'utf8')) || /hover\s*:\s*hover/.test(css))
        add('accessibility','native-button', await page.locator('#target').evaluate(el=>el.tagName==='BUTTON'&&el.textContent.trim()==='Export'))
        const touch=await browser.newContext({viewport:{width:390,height:900},hasTouch:true,isMobile:true})
        try {
          const target=await touch.newPage(), source=await touch.newPage()
          await target.goto(pathToFileURL(join(root,'index.html')).href)
          await source.goto(pathToFileURL(join(baselineRoot,'source.html')).href)
          if(await target.evaluate(()=>matchMedia('(hover: hover)').matches)) throw new Error('Touch control unexpectedly supports hover')
          for(const state of ['rest','tap']) {
            if(state==='tap') {
              await target.locator('#target').tap();await source.locator('#target').tap()
              await target.waitForTimeout(250)
            }
            const paint=p=>p.locator('#target').evaluate(el=>{
              const style=getComputedStyle(el)
              return [style.backgroundColor,style.color,style.opacity]
            })
            const actual=await paint(target),expected=await paint(source)
            const properties = ['background-color', 'color', 'opacity']
            add('styling',`touch-${state}`,JSON.stringify(actual)===JSON.stringify(expected), actual.flatMap((value, i) => value === expected[i] ? [] : [{ node: 0, property: properties[i], actual: value, expected: expected[i] }]))
            importSamples.push({ check: checks.at(-1), sameNodeCount: true, touch: true })
          }
        } finally {await touch.close()}
      }
      await original.close()
    }
    add('functional', 'page-errors', errors.length===0, errors)
  } catch (error) { add('functional','browser-check',false,error.message) }
  finally { await context.close() }
  // Normalize sampled colors only after all state measurements, in an isolated
  // page. Preserve raw values and every equivalence decision for later audits.
  let colorComparison = { policy: colorComparisonPolicy, equivalent: [] }
  try {
    for (const sample of importSamples) sample.entries = sample.check.actual.map(item => ({ ...item, check: sample.check.id }))
    const comparison = await compareColors(browser, importSamples.flatMap(sample => sample.entries))
    colorComparison = { policy: comparison.policy, equivalent: comparison.equivalent }
    const remaining = new Set(comparison.differences)
    for (const sample of importSamples) {
      sample.check.actual = sample.check.actual.filter((item, index) => remaining.has(sample.entries[index]))
      sample.check.pass = sample.sameNodeCount && sample.check.actual.length === 0
    }
  } catch (error) { colorComparison.error = error.message } // Keep strict raw verdicts on failure.
  for (const sample of importSamples.filter(sample => !sample.touch)) for (const difference of sample.check.actual) {
    const key = `${sample.state}:${difference.node}`
    let request = diagnosticRequests.find(item => item.key === key)
    if (!request) {
      request = { key, check: sample.check.id, selector: 'main *', index: difference.node, properties: [], width: sample.width, colorScheme: sample.colorScheme, state: sample.state, stateSelector: '#target' }
      diagnosticRequests.push(request)
    }
    if (request.check === sample.check.id && !request.properties.includes(difference.property)) request.properties.push(difference.property)
  }
  const verdict = kind => checks.some(c=>c.kind===kind) ? checks.filter(c=>c.kind===kind).every(c=>c.pass) : !buildError
  const result = { functional:verdict('functional'),styling:verdict('styling'),accessibility:verdict('accessibility'),browser:checks.every(c=>c.pass)?'passed':'failed',invalidClasses,checks,buildError,colorComparison }
  if (!includeDiagnostics) {
    writeFileSync(join(root, 'acceptance.json'), JSON.stringify(result, null, 2))
    return result
  }
  // Replay only after scoring is complete. CDP inspection must not stretch the
  // original transition samples or change acceptance/repair verdicts.
  const evidence = []
  for (const request of diagnosticRequests.slice(0, 6)) {
    try {
      evidence.push({ check: request.check, ...await compareStyleEvidence(browser, {
        ...request, source: pathToFileURL(join(baselineRoot, 'source.html')).href,
        target: pathToFileURL(join(root, 'index.html')).href
      }) })
    } catch (error) { evidence.push({ check: request.check, status: 'unavailable', error: error.message }) }
  }
  result.diagnostics = {
    version: 1, unresolvedClasses: classDiagnostics?.unresolved ?? null,
    classCoverage: classDiagnostics?.coverage ?? 'Manifest unavailable; classes were not checked.',
    evidence, omittedGroups: Math.max(0, diagnosticRequests.length - evidence.length),
    coverage: 'Read-only Chromium rule evidence from fresh state replays after scoring. Up to six element/state groups, at their first failing viewport/theme. Timing and script state may differ from the scored sample; computed differences in checks remain authoritative.'
  }
  writeFileSync(join(root, 'diagnostics.json'), JSON.stringify(result.diagnostics, null, 2))
  writeFileSync(join(root,'acceptance.json'),JSON.stringify(result,null,2))
  return result
}
