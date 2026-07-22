import { beforeAll, describe, expect, it } from 'vitest'
import {
  extractAstroClasses,
  extractClassCandidates,
  extractHTMLClasses,
  extractOxcClasses
} from '@master/css-source'
import { loadNativeBinding } from '../src'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

describe('Rust source extraction differential', () => {
  const sources = [
    `
      import styles from './style.css'
      const cls = "fg:red hover:bg:blue"
      const nested = { class: 'content:"a;b" bg:url("/logo.png")' }
    `,
    '<div class="{fg:red;bg:blue}" data-id="${id}"></div>',
    '<div class="--token:1rem $token:1rem"></div>',
    '<style>.ignored { color:red }</style><main class="block 😀:value"></main>',
    '// block\nconst classes = `fg:red m:1x`'
  ]

  for (const [index, source] of sources.entries()) {
    it(`matches generic source fixture ${index + 1}`, () => {
      const binding = loadNativeBinding({ required: true })!.binding
      expect(binding.extractClassCandidates(source)).toEqual(extractClassCandidates(source))
    })
  }
})

describe('Rust OXC extraction differential', () => {
  const fixtures = [
    {
      source: 'component.tsx',
      content: `
        const classes = 'block mx:auto'
        const active = clsx('fg:red', { 'p:4x': ok })
        element.classList.add('flex')
        export function App() {
          return <div className="hidden m:2x" />
        }
      `
    },
    {
      source: 'component.tsx?raw',
      content: `
        'use client'
        import React from 'react'
        export { helper } from 'pkg'
        await import('lazy-module')
        const fs = require('fs')
        const classes = 'block fg:red'
      `
    },
    {
      source: 'component.ts',
      content: 'const dynamic = `block ${active ? "fg:red" : "fg:blue"}`'
    },
    {
      source: 'broken.tsx',
      content: 'const broken = <div className="block"'
    }
  ]

  for (const [index, fixture] of fixtures.entries()) {
    it(`matches OXC fixture ${index + 1}`, () => {
      const binding = loadNativeBinding({ required: true })!.binding
      expect(binding.extractOxcClasses(fixture.source, fixture.content))
        .toEqual(extractOxcClasses(fixture.source, fixture.content))
    })
  }
})

describe('Rust HTML extraction differential', () => {
  const fixtures = [
    `
      <div class="block mx:auto"></div>
      <script>
        element.classList.add('fg:red', 'p:4x')
        const classes = 'flex hidden'
      </script>
      <main class="grid"></main>
    `,
    '<section CLASS="block"><span class="fg:red"></span></section>',
    '<script>const before = "m:1x"</script><div class="p:2x"></div>'
  ]

  for (const [index, content] of fixtures.entries()) {
    it(`matches HTML fixture ${index + 1}`, () => {
      const binding = loadNativeBinding({ required: true })!.binding
      expect(binding.extractHtmlClasses('index.html', content))
        .toEqual(extractHTMLClasses('index.html', content))
    })
  }
})

describe('Rust Astro extraction differential', () => {
  const fixtures = [
    `---
const frontmatterClasses = 'fg:red'
---
<script>
  const scriptClasses = 'p:4x'
</script>
<style>
  .ignored { color: red; }
</style>
<main class="block mx:auto">Hello</main>`,
    '<script>const one = "grid"</script><div class="flex"></div><script>const two = "hidden"</script>',
    '<main class="block"></main>'
  ]

  for (const [index, content] of fixtures.entries()) {
    it(`matches Astro fixture ${index + 1}`, () => {
      const binding = loadNativeBinding({ required: true })!.binding
      expect(binding.extractAstroClasses('Page.astro', content))
        .toEqual(extractAstroClasses('Page.astro', content))
    })
  }
})
