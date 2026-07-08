import type { BenchmarkFixtureId } from '../shared/types'

export const staticFixtureIds = [
  'minimal',
  'docs',
  'dashboard',
  'stress-css'
] satisfies BenchmarkFixtureId[]

export interface StaticFixtureSource {
  id: BenchmarkFixtureId
  masterHtml: string
  tailwindHtml: string
  expectedCSSMarkers: string[]
}

export function getStaticFixtureSource(id: BenchmarkFixtureId): StaticFixtureSource {
  const fixture = staticFixtureSources.find((candidate) => candidate.id === id)
  if (!fixture) throw new Error(`Static benchmark fixture is not implemented: ${id}`)
  return fixture
}

export const staticFixtureSources = [
  {
    id: 'minimal',
    expectedCSSMarkers: ['text-center'],
    masterHtml: page(`
      <main class="min-h:100vh bg:white fg:slate-90 flex items-center justify-center p:6x">
        <section class="w:full max-w:720px text-center grid gap:4x">
          <p class="m:0 font:14px font:semibold fg:blue-60 uppercase letter-spacing:.08em">Benchmark fixture</p>
          <h1 class="m:0 font:48px font:heavy leading:1.05 tracking:-.02em">Small useful landing page</h1>
          <p class="m:0 font:18px leading:1.65 fg:slate-60">A compact page with typography, spacing, rounded controls, and one responsive content block.</p>
          <div class="inline-flex justify-center gap:3x flex-wrap">
            <a class="inline-flex items-center justify-center h:44px px:5x r:8px bg:blue-60 fg:white font:14px font:semibold text-decoration:none" href="#start">Start</a>
            <a class="inline-flex items-center justify-center h:44px px:5x r:8px border:1px|solid|gray-20 fg:slate-80 font:14px font:semibold text-decoration:none" href="#docs">Docs</a>
          </div>
          <div class="grid grid-cols:3 gap:3x mt:5x">
            <div class="p:4x r:10px bg:gray-5 text-center"><strong class="block font:22px">24</strong><span class="font:12px fg:slate-50">rules</span></div>
            <div class="p:4x r:10px bg:gray-5 text-center"><strong class="block font:22px">3</strong><span class="font:12px fg:slate-50">states</span></div>
            <div class="p:4x r:10px bg:gray-5 text-center"><strong class="block font:22px">1</strong><span class="font:12px fg:slate-50">page</span></div>
          </div>
        </section>
      </main>
    `),
    tailwindHtml: page(`
      <main class="min-h-screen bg-white text-slate-900 flex items-center justify-center p-6">
        <section class="w-full max-w-3xl text-center grid gap-4">
          <p class="m-0 text-sm font-semibold text-blue-600 uppercase tracking-wider">Benchmark fixture</p>
          <h1 class="m-0 text-5xl font-black leading-none tracking-tight">Small useful landing page</h1>
          <p class="m-0 text-lg leading-relaxed text-slate-600">A compact page with typography, spacing, rounded controls, and one responsive content block.</p>
          <div class="inline-flex justify-center gap-3 flex-wrap">
            <a class="inline-flex items-center justify-center h-11 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold no-underline" href="#start">Start</a>
            <a class="inline-flex items-center justify-center h-11 px-5 rounded-lg border border-slate-200 text-slate-800 text-sm font-semibold no-underline" href="#docs">Docs</a>
          </div>
          <div class="grid grid-cols-3 gap-3 mt-5">
            <div class="p-4 rounded-xl bg-slate-50 text-center"><strong class="block text-2xl">24</strong><span class="text-xs text-slate-500">rules</span></div>
            <div class="p-4 rounded-xl bg-slate-50 text-center"><strong class="block text-2xl">3</strong><span class="text-xs text-slate-500">states</span></div>
            <div class="p-4 rounded-xl bg-slate-50 text-center"><strong class="block text-2xl">1</strong><span class="text-xs text-slate-500">page</span></div>
          </div>
        </section>
      </main>
    `)
  },
  {
    id: 'docs',
    expectedCSSMarkers: ['text-center'],
    masterHtml: page(`
      <div class="min-h:100vh bg:white fg:slate-90">
        <header class="sticky top:0 z:1 bg:white/.9 backdrop-filter:blur(12px) bb:1px|solid|gray-20">
          <nav class="max-w:1120px mx:auto px:6x py:3x flex items-center justify-between">
            <a class="font:18px font:heavy fg:slate-90 text-decoration:none" href="#">Docs</a>
            <div class="flex items-center gap:4x font:14px">
              <a class="fg:slate-60 text-decoration:none" href="#guide">Guide</a>
              <a class="fg:slate-60 text-decoration:none" href="#api">API</a>
              <a class="fg:slate-60 text-decoration:none" href="#bench">Benchmarks</a>
            </div>
          </nav>
        </header>
        <main class="max-w:1120px mx:auto px:6x py:8x grid grid-cols:220px|1fr gap:8x">
          <aside class="display:none display:block@lg">
            <div class="sticky top:72px grid gap:2x font:14px">
              <a class="fg:blue-60 font:semibold text-decoration:none" href="#intro">Introduction</a>
              <a class="fg:slate-60 text-decoration:none" href="#install">Installation</a>
              <a class="fg:slate-60 text-decoration:none" href="#config">Configuration</a>
              <a class="fg:slate-60 text-decoration:none" href="#limits">Limits</a>
            </div>
          </aside>
          <article class="min-w:0 grid gap:7x">
            <section class="grid gap:4x">
              <p class="m:0 font:14px font:semibold fg:blue-60 uppercase letter-spacing:.08em">Guide</p>
              <h1 class="m:0 font:44px font:heavy leading:1.1 tracking:-.02em">Building a dense documentation page</h1>
              <p class="m:0 font:18px leading:1.7 fg:slate-60">This fixture models article typography, side navigation, code samples, tables, callouts, and repeated inline states.</p>
            </section>
            <section id="install" class="grid gap:4x">
              <h2 class="m:0 font:28px font:bold">Installation</h2>
              <p class="m:0 leading:1.7 fg:slate-70">Install the package, import the stylesheet, and keep source detection explicit so generated CSS remains reproducible.</p>
              <pre class="m:0 p:5x r:10px bg:slate-95 fg:white overflow:auto font:14px leading:1.6"><code>npm install @master/css
import '@master/css'</code></pre>
            </section>
            <section id="api" class="grid gap:4x">
              <h2 class="m:0 font:28px font:bold">API surface</h2>
              <table class="w:full border-collapse:collapse font:14px">
                <thead class="bg:gray-5 text:left"><tr><th class="p:3x bb:1px|solid|gray-20">Name</th><th class="p:3x bb:1px|solid|gray-20">Purpose</th><th class="p:3x bb:1px|solid|gray-20 text-center">Stable</th></tr></thead>
                <tbody>
                  <tr><td class="p:3x bb:1px|solid|gray-20 font:semibold">runtime</td><td class="p:3x bb:1px|solid|gray-20">DOM class discovery</td><td class="p:3x bb:1px|solid|gray-20 text-center">Yes</td></tr>
                  <tr><td class="p:3x bb:1px|solid|gray-20 font:semibold">static</td><td class="p:3x bb:1px|solid|gray-20">Generated stylesheet output</td><td class="p:3x bb:1px|solid|gray-20 text-center">Yes</td></tr>
                  <tr><td class="p:3x bb:1px|solid|gray-20 font:semibold">progressive</td><td class="p:3x bb:1px|solid|gray-20">Inline first page CSS and adopt runtime</td><td class="p:3x bb:1px|solid|gray-20 text-center">Planned</td></tr>
                </tbody>
              </table>
            </section>
            <section class="p:5x r:10px bg:blue-5 border:1px|solid|blue-20">
              <h2 class="m:0|0|2x font:22px font:bold">Benchmark note</h2>
              <p class="m:0 leading:1.7 fg:slate-70">Numbers are advisory and must pass correctness checks before being compared.</p>
            </section>
          </article>
        </main>
      </div>
    `),
    tailwindHtml: page(`
      <div class="min-h-screen bg-white text-slate-900">
        <header class="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-slate-200">
          <nav class="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <a class="text-lg font-black text-slate-900 no-underline" href="#">Docs</a>
            <div class="flex items-center gap-4 text-sm">
              <a class="text-slate-600 no-underline" href="#guide">Guide</a>
              <a class="text-slate-600 no-underline" href="#api">API</a>
              <a class="text-slate-600 no-underline" href="#bench">Benchmarks</a>
            </div>
          </nav>
        </header>
        <main class="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-[220px_1fr] gap-8">
          <aside class="hidden lg:block">
            <div class="sticky top-[72px] grid gap-2 text-sm">
              <a class="text-blue-600 font-semibold no-underline" href="#intro">Introduction</a>
              <a class="text-slate-600 no-underline" href="#install">Installation</a>
              <a class="text-slate-600 no-underline" href="#config">Configuration</a>
              <a class="text-slate-600 no-underline" href="#limits">Limits</a>
            </div>
          </aside>
          <article class="min-w-0 grid gap-7">
            <section class="grid gap-4">
              <p class="m-0 text-sm font-semibold text-blue-600 uppercase tracking-wider">Guide</p>
              <h1 class="m-0 text-5xl font-black leading-tight tracking-tight">Building a dense documentation page</h1>
              <p class="m-0 text-lg leading-relaxed text-slate-600">This fixture models article typography, side navigation, code samples, tables, callouts, and repeated inline states.</p>
            </section>
            <section id="install" class="grid gap-4">
              <h2 class="m-0 text-3xl font-bold">Installation</h2>
              <p class="m-0 leading-relaxed text-slate-700">Install the package, import the stylesheet, and keep source detection explicit so generated CSS remains reproducible.</p>
              <pre class="m-0 p-5 rounded-xl bg-slate-950 text-white overflow-auto text-sm leading-relaxed"><code>npm install @master/css
import '@master/css'</code></pre>
            </section>
            <section id="api" class="grid gap-4">
              <h2 class="m-0 text-3xl font-bold">API surface</h2>
              <table class="w-full border-collapse text-sm">
                <thead class="bg-slate-50 text-left"><tr><th class="p-3 border-b border-slate-200">Name</th><th class="p-3 border-b border-slate-200">Purpose</th><th class="p-3 border-b border-slate-200 text-center">Stable</th></tr></thead>
                <tbody>
                  <tr><td class="p-3 border-b border-slate-200 font-semibold">runtime</td><td class="p-3 border-b border-slate-200">DOM class discovery</td><td class="p-3 border-b border-slate-200 text-center">Yes</td></tr>
                  <tr><td class="p-3 border-b border-slate-200 font-semibold">static</td><td class="p-3 border-b border-slate-200">Generated stylesheet output</td><td class="p-3 border-b border-slate-200 text-center">Yes</td></tr>
                  <tr><td class="p-3 border-b border-slate-200 font-semibold">progressive</td><td class="p-3 border-b border-slate-200">Inline first page CSS and adopt runtime</td><td class="p-3 border-b border-slate-200 text-center">Planned</td></tr>
                </tbody>
              </table>
            </section>
            <section class="p-5 rounded-xl bg-blue-50 border border-blue-200">
              <h2 class="m-0 mb-2 text-2xl font-bold">Benchmark note</h2>
              <p class="m-0 leading-relaxed text-slate-700">Numbers are advisory and must pass correctness checks before being compared.</p>
            </section>
          </article>
        </main>
      </div>
    `)
  },
  {
    id: 'dashboard',
    expectedCSSMarkers: ['text-center'],
    masterHtml: page(`
      <main class="min-h:100vh bg:gray-5 fg:slate-90 p:6x">
        <section class="max-w:1180px mx:auto grid gap:6x">
          <header class="flex items-center justify-between gap:4x">
            <div>
              <p class="m:0 font:13px font:semibold fg:blue-60 uppercase letter-spacing:.08em">Operations</p>
              <h1 class="m:1x|0|0 font:34px font:heavy tracking:-.02em">Revenue dashboard</h1>
            </div>
            <button class="h:40px px:4x r:8px bg:slate-90 fg:white border:0 font:14px font:semibold">Export</button>
          </header>
          <section class="grid grid-cols:4 gap:4x">
            ${masterCards()}
          </section>
          <section class="grid grid-cols:280px|1fr gap:4x">
            <aside class="p:5x r:12px bg:white border:1px|solid|gray-20 grid gap:4x">
              <h2 class="m:0 font:20px font:bold">Filters</h2>
              <label class="grid gap:2x font:13px fg:slate-60">Region<input class="h:38px px:3x r:8px border:1px|solid|gray-20 fg:slate-90" value="North America" /></label>
              <label class="grid gap:2x font:13px fg:slate-60">Status<select class="h:38px px:3x r:8px border:1px|solid|gray-20 fg:slate-90"><option>Active</option></select></label>
              <button class="h:38px r:8px bg:blue-60 fg:white border:0 font:14px font:semibold text-center">Apply</button>
            </aside>
            <div class="r:12px bg:white border:1px|solid|gray-20 overflow:hidden">
              <div class="p:4x bb:1px|solid|gray-20 flex items-center justify-between"><h2 class="m:0 font:20px font:bold">Accounts</h2><span class="font:13px fg:slate-50">12 rows</span></div>
              <table class="w:full border-collapse:collapse font:14px">
                <thead class="bg:gray-5 text:left"><tr><th class="p:3x">Account</th><th class="p:3x">Plan</th><th class="p:3x text-center">Health</th><th class="p:3x text:right">MRR</th></tr></thead>
                <tbody>${masterRows()}</tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
    `),
    tailwindHtml: page(`
      <main class="min-h-screen bg-slate-50 text-slate-900 p-6">
        <section class="max-w-7xl mx-auto grid gap-6">
          <header class="flex items-center justify-between gap-4">
            <div>
              <p class="m-0 text-xs font-semibold text-blue-600 uppercase tracking-wider">Operations</p>
              <h1 class="m-0 mt-1 text-4xl font-black tracking-tight">Revenue dashboard</h1>
            </div>
            <button class="h-10 px-4 rounded-lg bg-slate-900 text-white border-0 text-sm font-semibold">Export</button>
          </header>
          <section class="grid grid-cols-4 gap-4">
            ${tailwindCards()}
          </section>
          <section class="grid grid-cols-[280px_1fr] gap-4">
            <aside class="p-5 rounded-xl bg-white border border-slate-200 grid gap-4">
              <h2 class="m-0 text-xl font-bold">Filters</h2>
              <label class="grid gap-2 text-xs text-slate-600">Region<input class="h-10 px-3 rounded-lg border border-slate-200 text-slate-900" value="North America" /></label>
              <label class="grid gap-2 text-xs text-slate-600">Status<select class="h-10 px-3 rounded-lg border border-slate-200 text-slate-900"><option>Active</option></select></label>
              <button class="h-10 rounded-lg bg-blue-600 text-white border-0 text-sm font-semibold text-center">Apply</button>
            </aside>
            <div class="rounded-xl bg-white border border-slate-200 overflow-hidden">
              <div class="p-4 border-b border-slate-200 flex items-center justify-between"><h2 class="m-0 text-xl font-bold">Accounts</h2><span class="text-xs text-slate-500">12 rows</span></div>
              <table class="w-full border-collapse text-sm">
                <thead class="bg-slate-50 text-left"><tr><th class="p-3">Account</th><th class="p-3">Plan</th><th class="p-3 text-center">Health</th><th class="p-3 text-right">MRR</th></tr></thead>
                <tbody>${tailwindRows()}</tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
    `)
  },
  {
    id: 'stress-css',
    expectedCSSMarkers: ['text-center'],
    masterHtml: page(`
      <main class="p:6x bg:white fg:slate-90">
        <h1 class="m:0|0|4x font:32px font:heavy text-center">Stress CSS fixture</h1>
        <section class="grid grid-cols:6 gap:2x">${masterStressNodes()}</section>
      </main>
    `),
    tailwindHtml: page(`
      <main class="p-6 bg-white text-slate-900">
        <h1 class="m-0 mb-4 text-3xl font-black text-center">Stress CSS fixture</h1>
        <section class="grid grid-cols-6 gap-2">${tailwindStressNodes()}</section>
      </main>
    `)
  }
] satisfies StaticFixtureSource[]

function page(body: string) {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '    <meta charset="utf-8">',
    '    <meta name="viewport" content="width=device-width, initial-scale=1">',
    '    <title>Benchmark fixture</title>',
    '</head>',
    '<body class="benchmark-root">',
    trimIndent(body),
    '</body>',
    '</html>'
  ].join('\n')
}

function masterCards() {
  return ['Revenue', 'Activation', 'Retention', 'Expansion'].map((label, index) => `
    <article class="p:5x r:12px bg:white border:1px|solid|gray-20">
      <p class="m:0 font:13px fg:slate-50">${label}</p>
      <strong class="block mt:2x font:28px font:heavy">${index === 0 ? '$128.4k' : `${64 + index * 7}%`}</strong>
      <span class="inline-flex mt:3x px:2x py:1x r:999px bg:green-10 fg:green-70 font:12px font:semibold">+${index + 4}.2%</span>
    </article>
  `).join('\n')
}

function tailwindCards() {
  return ['Revenue', 'Activation', 'Retention', 'Expansion'].map((label, index) => `
    <article class="p-5 rounded-xl bg-white border border-slate-200">
      <p class="m-0 text-xs text-slate-500">${label}</p>
      <strong class="block mt-2 text-3xl font-black">${index === 0 ? '$128.4k' : `${64 + index * 7}%`}</strong>
      <span class="inline-flex mt-3 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">+${index + 4}.2%</span>
    </article>
  `).join('\n')
}

function masterRows() {
  return Array.from({ length: 12 }, (_, index) => `
    <tr class="bg:white bg:gray-5:hover">
      <td class="p:3x bt:1px|solid|gray-20 font:semibold">Account ${index + 1}</td>
      <td class="p:3x bt:1px|solid|gray-20 fg:slate-60">${index % 3 === 0 ? 'Enterprise' : 'Growth'}</td>
      <td class="p:3x bt:1px|solid|gray-20 text-center"><span class="inline-flex px:2x py:1x r:999px bg:blue-5 fg:blue-70 font:12px font:semibold">${88 - index}%</span></td>
      <td class="p:3x bt:1px|solid|gray-20 text:right">$${(index + 2) * 920}</td>
    </tr>
  `).join('\n')
}

function tailwindRows() {
  return Array.from({ length: 12 }, (_, index) => `
    <tr class="bg-white hover:bg-slate-50">
      <td class="p-3 border-t border-slate-200 font-semibold">Account ${index + 1}</td>
      <td class="p-3 border-t border-slate-200 text-slate-600">${index % 3 === 0 ? 'Enterprise' : 'Growth'}</td>
      <td class="p-3 border-t border-slate-200 text-center"><span class="inline-flex px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">${88 - index}%</span></td>
      <td class="p-3 border-t border-slate-200 text-right">$${(index + 2) * 920}</td>
    </tr>
  `).join('\n')
}

function masterStressNodes() {
  const blue = [5, 20, 40, 60, 80, 95]
  const gray = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90]

  return Array.from({ length: 120 }, (_, index) => {
    const classes = [
      `w:${32 + index}px`,
      `h:${18 + index % 48}px`,
      `p:${index % 14}px`,
      `m:${index % 9}px`,
      `r:${index % 16}px`,
      `bg:blue-${blue[index % blue.length]}`,
      `fg:gray-${gray[(index + 5) % gray.length]}`,
      `border:${index % 3 + 1}px|solid|gray-${gray[index % gray.length]}`,
      `font:${12 + index % 10}px`,
      `opacity:.${5 + index % 5}`,
      'text-center'
    ].join(' ')
    return `<div class="${classes}">${index}</div>`
  }).join('\n')
}

function tailwindStressNodes() {
  const blue = [50, 100, 200, 400, 600, 900]
  const slate = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
  const opacity = [50, 60, 70, 80, 90]

  return Array.from({ length: 120 }, (_, index) => {
    const classes = [
      `w-[${32 + index}px]`,
      `h-[${18 + index % 48}px]`,
      `p-[${index % 14}px]`,
      `m-[${index % 9}px]`,
      `rounded-[${index % 16}px]`,
      `bg-blue-${blue[index % blue.length]}`,
      `text-slate-${slate[(index + 5) % slate.length]}`,
      `border-${index % 3 + 1}`,
      `border-slate-${slate[index % slate.length]}`,
      `text-[${12 + index % 10}px]`,
      `opacity-${opacity[index % opacity.length]}`,
      'text-center'
    ].join(' ')
    return `<div class="${classes}">${index}</div>`
  }).join('\n')
}

function trimIndent(value: string) {
  const lines = value.replace(/^\n|\n\s*$/g, '').split('\n')
  const indentation = lines
    .filter((line) => line.trim())
    .reduce((min, line) => Math.min(min, line.match(/^\s*/)?.[0].length ?? 0), Infinity)

  return lines.map((line) => line.slice(indentation)).join('\n')
}
