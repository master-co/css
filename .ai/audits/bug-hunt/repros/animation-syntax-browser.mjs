import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const source = readFileSync(new URL('../../../../crates/mastercss-render/tests/bug_hunt_animation_syntax.rs', import.meta.url), 'utf8')
const pattern = /animation_case!\(\s*(\w+),\s*(?:r#"([\s\S]*?)"#|r"([^"]*)"|("(?:\\.|[^"\\])*")),\s*(true|false)\s*,?\s*\);/g
const cases = [...source.matchAll(pattern)].map(match => ({ id: match[1], css: match[2] ?? match[3] ?? JSON.parse(match[4]), expected: match[5] === 'true' }))
assert.equal(cases.length, 22)
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
let failures = 0
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
  try {
    const page = await browser.newPage()
    await page.setContent('<!doctype html><div class="x">probe</div>')
    for (const item of cases) {
      const actual = await page.evaluate(css => {
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(css)
        document.adoptedStyleSheets = [sheet]
        const definitions = []
        function visit(rules) {
          for (const rule of rules) {
            if (rule.type === CSSRule.KEYFRAMES_RULE) definitions.push(rule.name)
            else if ('cssRules' in rule) visit(rule.cssRules)
          }
        }
        visit(sheet.cssRules)
        const animationName = getComputedStyle(document.querySelector('.x')).animationName
        const normalized = animationName.replace(/^['"]|['"]$/g, '')
        return { animationName, definitions, needsManifestAnimation: normalized === 'fade' && !definitions.includes('fade'), parsedRules: [...sheet.cssRules].map(rule => rule.cssText) }
      }, item.css)
      const pass = actual.needsManifestAnimation === item.expected
      if (!pass) failures++
      console.log(JSON.stringify({ browser: name, ...item, ...actual, result: pass ? 'PASS' : 'FAIL' }))
    }
  } finally { await browser.close() }
}
assert.equal(failures, 0, 'Browser semantics must support every Rust regression expectation')
