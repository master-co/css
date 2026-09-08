import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

assert(process.cwd().includes('master-css-bh-isolated-'))
const engine=process.env.BH_BROWSER
assert(['firefox','webkit'].includes(engine))
let source=readFileSync('tests/dev-hmr-e2e.test.ts','utf8')
function replaceOnce(from,to) {
 assert.equal(source.split(from).length,2,`expected one source marker: ${from}`)
 source=source.replace(from,to)
}
replaceOnce('import { chromium, type Browser }', 'import { firefox, webkit, type Browser }')
replaceOnce('browser = await chromium.launch()',`browser = await ${engine}.launch()`)
replaceOnce('    } finally {', `
      for (const display of ['inline-flex','grid','flex','inline-flex']) {
        writeFileSync(globalsPath, createGlobalsCSS(display))
        await page.waitForFunction(expected => getComputedStyle(document.getElementById('probe')!).display === expected, display)
        expect(await page.evaluate(() => (window as any).__MASTER_CSS_HMR_MARKER)).toBe('preserve')
      }
      console.log(JSON.stringify({ browser: '${engine}', version: browser.version(), hydration: true, cascade: 'block', edits: 5, preservedMarker: true }))
    } catch (error) {
      console.error(output.text)
      throw error
    } finally {`)
const path='tests/bug-hunt-browser-e2e.test.ts'
writeFileSync(path,source)
const result=spawnSync('pnpm',['exec','vitest','run',path],{env:{...process.env,npm_lifecycle_event:'e2e'},stdio:'inherit',timeout:210000})
process.exitCode=result.status??1
