import { test, expect, it } from 'vitest'
import { MasterCSSScanner } from './test-scanner'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('syntax', async () => {
  const scanner = await new MasterCSSScanner({}, __dirname).init()
  const testClasses = [
    "{fg-blue-40/.5;font-size:2rem;padding:1rem;width:100%;text-align:center}>li:hover@md",
    "width:calc(+100%-1.25rem)",
    "padding:0.625rem|1.25rem|1.875rem|2.5rem",
    "margin:1.25rem|1.875rem",
    'transition:transform|.1s|ease-out,width|.1s|ease-out',
    "background:rgb(51|170|51|.4)",
    'width:51px',
    'transform:scale(1.2)',
    'transform:translateX(20px)',
    'bg-indigo-40:hover@3xs',
    'transform:translate(20px,50px)',
    'transform:rotate(45deg)',
    'filter:blur(2px)',
    'width:2.125rem:active:not([disabled])+svg>rect',
    'cursor:no-drop[disabled]+svg',
    'filter:drop-shadow(0|2px|2px|rgba(0,0,0,.2px))',
    'font:var(--size)',
    'font:$size',
    'bg-blue:hover@media(any-hover:hover)',
    "background:gray-1@supports(backdrop-filter:none)",
    'font-size:1.5rem:hover@sm',
    "text-align:center:hover@sm",
    'fg-sky-60/.5:hover@sm',
    "{padding:0.625rem|1.25rem|1.875rem|2.5rem;text-align:center;fg-sky-60/.5}:hover@sm",
    'width:2.125rem:active:not([disabled])+svg>rect',
    'cursor:no-drop[disabled]+svg',
    'transform:translateX(20px)',
    'transform:translate(20px,50px)',
    'transform:rotate(45deg)',
    'transition:transform|.1s|ease-out,width|.1s|ease-out',
    'filter:drop-shadow(0|2px|2px|rgba(0,0,0,.2px))',
    'font:var(--size)',
    'font:$size',
    'animation:shake|1s|infinite>li',
    'animation:shake|1s|infinite>li:nth-child(2)',
    'bg-red:nth-child(2)',
    'bg-red:odd',
    'bg-red:even',
    'bg-red:first',
    'bg-red:last',
    "{width:0.313rem;height:0.313rem;border-radius:1e9em;bg-slate-90}::scrollbar",
    'bg-gray-20::scrollbar@dark',
    "background:slate-86::scrollbar-thumb",
    "background:slate-76::scrollbar-thumb:hover",
    "background:slate-66::scrollbar-thumb:active",
    'bg-gray-30::scrollbar-thumb@dark',
    'bg-gray-40::scrollbar-thumb:hover@dark',
    'bg-gray-50::scrollbar-thumb:active@dark',
    'background-color:transparent::-webkit-scrollbar-corner',
    "border-radius:1e9em::scrollbar-thumb",
    'bg-gray-60::scrollbar-thumb:active@dark',
    "margin:0.625rem|1.25rem",
    'bg-blue-60',
    'outline:3px|solid|var(--color-red):hover',
    "text-align:center@sm",
    'opacity:.5',
    '.sidebar:hover_{opacity:.75}',
    ".navitem:hover_{background:black/.75}"
  ]
  await scanner.scan('syntax.html', readFileSync(join(__dirname, 'syntax.html'), 'utf-8'))
  for (const eachGeneratedClass of scanner?.css.utilitiesLayer.rules.map(({ name }) => name) || []) {
    expect(testClasses).toContain(eachGeneratedClass)
  }
})

it('preserves declarations whose CSS capability is unknown', async () => {
  const scanner = await new MasterCSSScanner({}, __dirname).init()
  await scanner.scan(
    'validation.html',
    '<div class="text-wrap:pretty text-decoration:bad()"></div>'
  )

  expect(scanner.validClasses).toContain('text-wrap:pretty')
  expect(scanner.validClasses).toContain('text-decoration:bad()')
})
