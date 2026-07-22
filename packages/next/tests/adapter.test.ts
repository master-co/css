import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createComposedAdapter, renderNextBuildOutputs } from '../src/adapter'
import type { NextAdapter } from 'next'
import { ServerCSS, ServerRenderer } from '@master/css-server'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from '@master/css-schema/hydration-manifest'

type BuildCompleteContext = Parameters<NonNullable<NextAdapter['onBuildComplete']>>[0]

let fixtureDir: string | undefined

function createFixtureDir() {
  fixtureDir = mkdtempSync(join(tmpdir(), 'master-css-next-'))
  return fixtureDir
}

function createBuildContext(
  projectDir: string,
  htmlFile: string,
  options: { id?: string, output?: 'export', pathname?: string } = {}
): BuildCompleteContext {
  const distDir = join(projectDir, '.next')
  const id = options.id ?? 'index'
  const pathname = options.pathname ?? '/'
  return {
    projectDir,
    repoRoot: projectDir,
    distDir,
    nextVersion: '16.2.4',
    buildId: 'test-build',
    routing: {
      beforeMiddleware: [],
      beforeFiles: [],
      afterFiles: [],
      dynamicRoutes: [],
      onMatch: [],
      fallback: [],
      shouldNormalizeNextData: false,
      rsc: {}
    },
    config: options.output ? { output: options.output } : {},
    outputs: {
      pages: [],
      middleware: undefined,
      appPages: [],
      pagesApi: [],
      appRoutes: [],
      staticFiles: [
        {
          id,
          type: 'STATIC_FILE',
          filePath: htmlFile,
          pathname,
          immutableHash: undefined
        },
        {
          id: 'asset',
          type: 'STATIC_FILE',
          filePath: join(distDir, 'app.js'),
          pathname: '/app.js',
          immutableHash: undefined
        }
      ],
      prerenders: [
        {
          id: 'fallback',
          type: 'PRERENDER',
          parentOutputId: id,
          groupId: 0,
          pathname: '/',
          fallback: {
            filePath: htmlFile,
            postponedState: undefined
          },
          config: {}
        }
      ]
    }
  } as unknown as BuildCompleteContext
}

function countHydrationManifestScripts(html: string) {
  return html.match(new RegExp(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`, 'g'))?.length ?? 0
}

function readMasterStyle(html: string) {
  return html.match(/<style\b(?=[^>]*\bid=(["'])master-css\1)[^>]*>([\s\S]*?)<\/style>/)?.[2] ?? ''
}

function readHydrationManifestSource(html: string) {
  return html.match(new RegExp(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="([^"]+)"`))?.[1]
}

function toPosixPath(path: string) {
  return path.replaceAll('\\', '/')
}

afterEach(() => {
  vi.restoreAllMocks()
  if (fixtureDir) {
    rmSync(fixtureDir, { recursive: true, force: true })
    fixtureDir = undefined
  }
})

describe('renderNextBuildOutputs', () => {
  it('disposes each Rust render session after materializing its output', async () => {
    const projectDir = createFixtureDir()
    const htmlFile = join(projectDir, '.next/server/app/index.html')
    mkdirSync(join(projectDir, '.next/server/app'), { recursive: true })
    writeFileSync(htmlFile, '<!doctype html><html><head></head><body><h1 class="fg:red">Hello</h1></body></html>')
    const dispose = vi.spyOn(ServerCSS.prototype, 'dispose')

    await renderNextBuildOutputs(createBuildContext(projectDir, htmlFile))

    expect(dispose).toHaveBeenCalledOnce()
  })

  it('shares one build renderer without leaking rules between HTML outputs', async () => {
    const projectDir = createFixtureDir()
    const distDir = join(projectDir, '.next')
    const firstFile = join(distDir, 'server/app/first.html')
    const secondFile = join(distDir, 'server/app/second.html')
    mkdirSync(join(distDir, 'server/app'), { recursive: true })
    writeFileSync(firstFile, '<!doctype html><html><head></head><body><h1 class="fg:red">First</h1></body></html>')
    writeFileSync(secondFile, '<!doctype html><html><head></head><body><h1 class="fg:blue">Second</h1></body></html>')
    const context = createBuildContext(projectDir, firstFile)
    context.outputs.staticFiles.push({
      id: 'second',
      type: context.outputs.staticFiles[0].type,
      filePath: secondFile,
      pathname: '/second',
      immutableHash: undefined
    })
    const dispose = vi.spyOn(ServerRenderer.prototype, 'dispose')

    await renderNextBuildOutputs(context)

    const firstHTML = readFileSync(firstFile, 'utf-8')
    const secondHTML = readFileSync(secondFile, 'utf-8')
    expect(readMasterStyle(firstHTML)).toContain('.fg\\:red')
    expect(readMasterStyle(firstHTML)).not.toContain('.fg\\:blue')
    expect(readMasterStyle(secondHTML)).toContain('.fg\\:blue')
    expect(readMasterStyle(secondHTML)).not.toContain('.fg\\:red')
    expect(dispose).toHaveBeenCalledOnce()
  })

  it('disposes the build renderer when an output fails', async () => {
    const projectDir = createFixtureDir()
    const missingFile = join(projectDir, '.next/server/app/missing.html')
    const dispose = vi.spyOn(ServerRenderer.prototype, 'dispose')

    await expect(renderNextBuildOutputs(
      createBuildContext(projectDir, missingFile)
    )).rejects.toThrow()

    expect(dispose).toHaveBeenCalledOnce()
  })

  it('renders Master CSS into static HTML outputs once', async () => {
    const projectDir = createFixtureDir()
    const distDir = join(projectDir, '.next')
    const htmlFile = join(distDir, 'server/app/index.html')
    mkdirSync(join(distDir, 'server/app'), { recursive: true })
    writeFileSync(htmlFile, '<!doctype html><html><head></head><body><h1 class="font:40px fg:red">Hello</h1></body></html>')

    const outputs = await renderNextBuildOutputs(
      createBuildContext(projectDir, htmlFile),
      { buildReport: true }
    )
    const html = readFileSync(htmlFile, 'utf-8')

    expect(outputs).toHaveLength(1)
    expect(outputs[0].classes).toEqual(['font:40px', 'fg:red'])
    expect(outputs[0].rendered).toBe(true)
    expect(outputs[0].hydrationManifestBytes).toBeGreaterThan(0)
    const hydrationManifestFile = outputs[0].hydrationManifestFile
    if (!hydrationManifestFile) throw new Error('Expected a Next hydration manifest file.')
    expect(toPosixPath(hydrationManifestFile)).toMatch(/\.next\/static\/master-css\/hydration\/master-css-hydration\.[0-9a-f]{8}\.json$/)
    expect(html).toContain('<style id="master-css"')
    expect(readHydrationManifestSource(html)).toMatch(/^\/_next\/static\/master-css\/hydration\/master-css-hydration\.[0-9a-f]{8}\.json$/)
    expect(html).not.toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
    expect(countHydrationManifestScripts(html)).toBe(0)
    expect(html).toContain('.font\\:40px')
    expect(html).toContain('.fg\\:red')
    expect(existsSync(join(distDir, 'master-css-build-report.json'))).toBe(true)
    expect(existsSync(hydrationManifestFile)).toBe(true)
    const hydrationManifest = JSON.parse(readFileSync(hydrationManifestFile, 'utf-8'))
    expect(hydrationManifest.rules.map((rule: { className: string }) => rule.className)).toEqual(expect.arrayContaining(['font:40px', 'fg:red']))
    expect(hydrationManifest.rules).toHaveLength(2)
  })

  it('writes static export hydration manifests into the default export root', async () => {
    const projectDir = createFixtureDir()
    const exportDir = join(projectDir, 'out')
    const htmlFile = join(exportDir, 'guides/getting-started.html')
    mkdirSync(join(exportDir, 'guides'), { recursive: true })
    writeFileSync(htmlFile, '<!doctype html><html><head></head><body><h1 class="fg:red">Hello</h1></body></html>')

    const outputs = await renderNextBuildOutputs(
      createBuildContext(projectDir, htmlFile, {
        id: '/guides/getting-started.html',
        output: 'export',
        pathname: '/guides/getting-started'
      })
    )
    const html = readFileSync(htmlFile, 'utf-8')
    const hydrationManifestFile = outputs[0].hydrationManifestFile
    if (!hydrationManifestFile) throw new Error('Expected a static export hydration manifest file.')

    expect(toPosixPath(hydrationManifestFile)).toMatch(/\/out\/_next\/static\/master-css\/hydration\/master-css-hydration\.[0-9a-f]{8}\.json$/)
    expect(existsSync(hydrationManifestFile)).toBe(true)
    expect(existsSync(join(projectDir, '.next/static/master-css/hydration'))).toBe(false)
    expect(readHydrationManifestSource(html)).toBe(`/_next/static/master-css/hydration/${basename(hydrationManifestFile)}`)
  })

  it('derives a custom static export root from nested output metadata', async () => {
    const projectDir = createFixtureDir()
    const exportDir = join(projectDir, 'custom-export')
    const htmlFile = join(exportDir, 'nested/index.html')
    mkdirSync(join(exportDir, 'nested'), { recursive: true })
    writeFileSync(htmlFile, '<!doctype html><html><head></head><body><h1 class="fg:red">Hello</h1></body></html>')

    const outputs = await renderNextBuildOutputs(
      createBuildContext(projectDir, htmlFile, {
        id: '/nested/index.html',
        output: 'export',
        pathname: '/nested/'
      })
    )
    const hydrationManifestFile = outputs[0].hydrationManifestFile
    if (!hydrationManifestFile) throw new Error('Expected a custom export hydration manifest file.')

    expect(toPosixPath(hydrationManifestFile)).toContain('/custom-export/_next/static/master-css/hydration/')
    expect(existsSync(hydrationManifestFile)).toBe(true)
  })

  it('fails when static export output metadata cannot identify the export root', async () => {
    const projectDir = createFixtureDir()
    const htmlFile = join(projectDir, 'out/index.html')
    mkdirSync(join(projectDir, 'out'), { recursive: true })
    writeFileSync(htmlFile, '<!doctype html><html><head></head><body><h1 class="fg:red">Hello</h1></body></html>')

    await expect(renderNextBuildOutputs(
      createBuildContext(projectDir, htmlFile, {
        id: '/nested/index.html',
        output: 'export'
      })
    )).rejects.toThrow('Cannot resolve the static export root')
  })

  it('does not write empty Master CSS for non-Master classes', async () => {
    const projectDir = createFixtureDir()
    const distDir = join(projectDir, '.next')
    const htmlFile = join(distDir, 'server/pages/404.html')
    const sourceHTML = '<!doctype html><html><head></head><body><h1 class="next-error-h1">404</h1></body></html>'
    mkdirSync(join(distDir, 'server/pages'), { recursive: true })
    writeFileSync(htmlFile, sourceHTML)

    const outputs = await renderNextBuildOutputs(createBuildContext(projectDir, htmlFile))
    const html = readFileSync(htmlFile, 'utf-8')

    expect(outputs[0].classes).toEqual(['next-error-h1'])
    expect(outputs[0].cssBytes).toBe(0)
    expect(outputs[0].hydrationManifestBytes).toBe(0)
    expect(outputs[0].hydrationManifestFile).toBeUndefined()
    expect(outputs[0].rendered).toBe(false)
    expect(html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
    expect(html).toBe(sourceHTML)
  })

  it('does not inline native-only managed CSS entry output', async () => {
    const projectDir = createFixtureDir()
    const distDir = join(projectDir, '.next')
    const htmlFile = join(distDir, 'server/app/index.html')
    const sourceHTML = '<!doctype html><html><head></head><body><button class="btn native-used root-native">Button</button></body></html>'
    mkdirSync(join(distDir, 'server/app'), { recursive: true })
    mkdirSync(join(projectDir, 'src'), { recursive: true })
    writeFileSync(join(projectDir, 'src/styles.scss'), [
      '$accent: #123;',
      '',
      '.native-used {',
      '    color: $accent;',
      '}',
      '',
      '.native-unused {',
      '    color: #456;',
      '}',
      '',
      '@layer components {',
      '    .btn {',
      '        display: inline-flex;',
      '    }',
      '}'
    ].join('\n'))
    writeFileSync(join(projectDir, 'app.css'), [
      '@master entry;',
      '',
      '.root-native {',
      '    color: #789;',
      '}',
      '',
      '.root-unused {',
      '    color: #abc;',
      '}',
      '',
      '@layer components {',
      '    .btn {',
      '        display: grid;',
      '    }',
      '}'
    ].join('\n'))
    writeFileSync(htmlFile, sourceHTML)

    const outputs = await renderNextBuildOutputs(createBuildContext(projectDir, htmlFile))
    const html = readFileSync(htmlFile, 'utf-8')

    expect(outputs[0].rendered).toBe(false)
    expect(outputs[0].cssBytes).toBe(0)
    expect(html).toBe(sourceHTML)
    expect(html).not.toContain('<style id="master-css">')
    expect(html).not.toContain('data-master-css')
    expect(html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
  })

  it('keeps only generated CSS in style#master-css when native CSS is also present', async () => {
    const projectDir = createFixtureDir()
    const distDir = join(projectDir, '.next')
    const htmlFile = join(distDir, 'server/app/index.html')
    mkdirSync(join(distDir, 'server/app'), { recursive: true })
    writeFileSync(join(projectDir, 'app.css'), [
      '@master entry;',
      '',
      '.root-native {',
      '    color: #789;',
      '}'
    ].join('\n'))
    writeFileSync(htmlFile, '<!doctype html><html><head></head><body><h1 class="root-native fg:red">Hello</h1></body></html>')

    const outputs = await renderNextBuildOutputs(createBuildContext(projectDir, htmlFile))
    const html = readFileSync(htmlFile, 'utf-8')
    const masterStyle = readMasterStyle(html)

    expect(outputs[0].rendered).toBe(true)
    expect(masterStyle).toContain('.fg\\:red')
    expect(masterStyle).not.toContain('.root-native')
    expect(html).toContain(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="/_next/static/master-css/hydration/`)
    expect(html).not.toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
    expect(html).not.toContain('"className":"root-native"')
  })
})

describe('createComposedAdapter', () => {
  it('runs the Master CSS adapter before the external adapter by default', async () => {
    const calls: string[] = []
    const adapter = createComposedAdapter(
      {
        name: 'master',
        async onBuildComplete() {
          calls.push('master')
        }
      },
      async () => ({
        default: {
          name: 'external',
          async onBuildComplete() {
            calls.push('external')
          }
        }
      })
    )

    await adapter.onBuildComplete?.({} as BuildCompleteContext)

    expect(calls).toEqual(['master', 'external'])
  })

  it('can run the external adapter before the Master CSS adapter', async () => {
    const calls: string[] = []
    const adapter = createComposedAdapter(
      {
        name: 'master',
        async onBuildComplete() {
          calls.push('master')
        }
      },
      {
        name: 'external',
        async onBuildComplete() {
          calls.push('external')
        }
      },
      { order: 'external-first' }
    )

    await adapter.onBuildComplete?.({} as BuildCompleteContext)

    expect(calls).toEqual(['external', 'master'])
  })
})
