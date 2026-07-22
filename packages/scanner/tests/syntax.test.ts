import { test, expect, it } from 'vitest'
import CSSScanner from '../src'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('syntax', async () => {
  const scanner = await new CSSScanner({}, __dirname).init()
  const testClasses = [
    '{fg:blue-40/.5;font:2rem;p:4x;w:full;text-center}>li:hover@md',
    'w:calc(+100%-1.25rem)',
    'p:0.625rem|5x|1.875rem|10x',
    'm:5x|1.875rem',
    'transition:transform|.1s|ease-out,width|.1s|ease-out',
    'bg:rgb(51|170|51|.4)',
    'width:51px',
    'transform:scale(1.2)',
    'transform:translateX(20px)',
    'bg:indigo-40:hover@3xs',
    'transform:translate(20px,50px)',
    'transform:rotate(45deg)',
    'filter:blur(2px)',
    'width:2.125rem:active:not([disabled])+svg>rect',
    'cursor:no-drop[disabled]+svg',
    'filter:drop-shadow(0|2px|2px|rgba(0,0,0,.2px))',
    'font:var(--size)',
    'font:$size',
    'bg:blue:hover@media(any-hover:hover)',
    'bg:gray-1@supports(backdrop-filter:none)',
    'font:1.5rem:hover@sm',
    'text-center:hover@sm',
    'fg:sky-60/.5:hover@sm',
    '{p:0.625rem|5x|1.875rem|10x;text-center;fg:sky-60/.5}:hover@sm',
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
    'bg:red:nth-child(2)',
    'bg:red:odd',
    'bg:red:even',
    'bg:red:first',
    'bg:red:last',
    '{w:0.313rem;h:0.313rem;rounded;bg:slate-90}::scrollbar',
    'bg:gray-20::scrollbar@dark',
    'bg:slate-86::scrollbar-thumb',
    'bg:slate-76::scrollbar-thumb:hover',
    'bg:slate-66::scrollbar-thumb:active',
    'bg:gray-30::scrollbar-thumb@dark',
    'bg:gray-40::scrollbar-thumb:hover@dark',
    'bg:gray-50::scrollbar-thumb:active@dark',
    'bg:transparent::-webkit-scrollbar-corner',
    'rounded::scrollbar-thumb',
    'bg:gray-60::scrollbar-thumb:active@dark',
    'm:0.625rem|5x',
    'bg:blue-60',
    'outline:3px|solid|red:hover',
    'text-center@sm',
    'opacity:.5',
    '.sidebar:hover_{opacity:.75}',
    '.navitem:hover_{bg:black/.75}'
  ]
  await scanner.scan('syntax.html', readFileSync(join(__dirname, 'syntax.html'), 'utf-8'))
  for (const eachGeneratedClass of scanner?.css.utilitiesLayer.rules.map(({ name }) => name) || []) {
    expect(testClasses).toContain(eachGeneratedClass)
  }
})

it('keeps CSS grammar validation in the host batch handshake', async () => {
  const scanner = await new CSSScanner({}, __dirname).init()
  await scanner.scan(
    'validation.html',
    '<div class="text-wrap:pretty text-decoration:bad()"></div>'
  )

  expect(scanner.validClasses).toContain('text-wrap:pretty')
  expect(scanner.invalidClasses).toContain('text-decoration:bad()')
})
