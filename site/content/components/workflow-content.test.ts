import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { compileManifestSync } from '@master/css-compiler/node'
import { MasterCSSLanguageService } from '@master/css-language-service'
import { createToolingSessionSync } from '@master/css-tooling/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import Color from 'colorjs.io'
import { planMasterCSSSetup, type MasterCSSSetupFramework } from '../../../packages/create/src/index'
import preset from '../../utils/preset-manifest'
import {
  workflowFrameworks,
  workflowGuides,
  workflowIntegrations,
  workflowProjectClass,
  workflowProjects,
  workflowRouteDefinitions,
  workflowRouteProjectCSS,
  workflowRouteReferences,
  workflowRoutes,
  workflowTraceChange,
  workflowTraceEdges,
  workflowTraceNodes
} from './workflow-content'

const repository = new URL('../../../', import.meta.url)
const installationGuides = new URL('../guide/installation/', import.meta.url)

/** The installer's name for a framework, when the installer sets it up. */
const installerFrameworks: Partial<Record<string, MasterCSSSetupFramework>> = {
  vite: 'vite',
  react: 'react',
  vuejs: 'vue',
  'react-router': 'react-router',
  laravel: 'laravel',
  lit: 'lit',
  webpack: 'webpack',
  rspack: 'rspack',
  rsbuild: 'rsbuild',
  nextjs: 'nextjs',
  nuxtjs: 'nuxt',
  astro: 'astro',
  svelte: 'svelte',
  angular: 'angular'
}

function guideText(directory: URL): string {
  return readdirSync(directory, { withFileTypes: true }).map((entry) => entry.isDirectory()
    ? guideText(new URL(`${entry.name}/`, directory))
    : entry.name.endsWith('.mdx') ? readFileSync(new URL(entry.name, directory), 'utf8') : '').join('\n')
}

/** Colors the language service renders for a class under a project manifest. */
async function swatches(source: string, className: string) {
  const { manifest } = compileManifestSync(source, { baseManifest: preset })
  const service = new MasterCSSLanguageService({ manifest: manifest as MasterCSSManifest }, { session: createToolingSessionSync({ manifest: manifest as MasterCSSManifest }) })
  const text = `<div class="${className}"></div>`
  const document = {
    uri: 'file:///workflow.html',
    languageId: 'html',
    version: 1,
    lineCount: 1,
    getText: (range?: { start: { character: number }, end: { character: number } }) => range ? text.slice(range.start.character, range.end.character) : text,
    positionAt: (index: number) => ({ line: 0, character: index }),
    offsetAt: (position: { character: number }) => position.character
  }
  return (await service.renderSyntaxColors(document as never) ?? []).map(({ color }) => new Color('srgb', [color.red, color.green, color.blue]))
}

/** The directory of a guide route, looking through route groups such as `(main)` that add no URL segment. */
function guideDirectory(pathname: string) {
  let directory: URL | undefined = new URL('../guide/', import.meta.url)
  for (const segment of pathname.replace(/^\/guide\//, '').split('/').filter(Boolean)) {
    const base: URL = directory!
    const groups = readdirSync(base, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^\(.+\)$/.test(entry.name))
    directory = [new URL(`${segment}/`, base), ...groups.map((group) => new URL(`${group.name}/${segment}/`, base))].find((candidate) => existsSync(candidate))
    if (!directory) return undefined
  }
  return directory
}

test('workflow cards link to guide pages and headings that exist', () => {
  for (const [card, href] of Object.entries(workflowGuides)) {
    const [pathname, anchor] = href.split('#')
    const directory = guideDirectory(pathname)
    assert.ok(directory && existsSync(new URL('page.tsx', directory)), `${card}: no page for ${pathname}`)
    if (!anchor) continue
    const headings = readFileSync(new URL('content.mdx', directory), 'utf8').match(/^#{2,4} .+$/gm) ?? []
    const slugs = headings.map((heading) => heading.replace(/^#+ /, '').toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'))
    assert.ok(slugs.includes(anchor), `${card}: no heading #${anchor} in ${pathname}`)
  }
})

test('workflow integrations are the packages in this repository', () => {
  const names = new Set(readdirSync(new URL('packages/', repository), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(new URL(`packages/${entry.name}/package.json`, repository)))
    .map((entry) => JSON.parse(readFileSync(new URL(`packages/${entry.name}/package.json`, repository), 'utf8')).name))
  for (const integration of workflowIntegrations) assert.ok(names.has(integration.name), integration.name)
})

test('the workflow stage puts each framework on the integration that sets it up', () => {
  const root = mkdtempSync(join(tmpdir(), 'home-workflow-'))
  try {
    for (const framework of workflowFrameworks) {
      const guide = new URL(`${framework.guide}/`, installationGuides)
      assert.ok(existsSync(guide), `missing guide /guide/installation/${framework.guide}`)
      const installer = installerFrameworks[framework.brand]
      // The installer's plan is the source of truth; frameworks it does not set up name the package in their guide.
      const evidence = installer
        ? JSON.stringify(planMasterCSSSetup({ root, framework: installer, install: false, minimal: true }))
        : guideText(guide)
      const expected = workflowIntegrations.find((item) => item.key === framework.integration)!.name
      const found = workflowIntegrations.filter((item) => new RegExp(`${item.name}\\b`).test(evidence)).map((item) => item.name)
      assert.deepEqual(found, [expected], framework.brand)
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('monorepo swatches are the colors each project gives the class', async () => {
  for (const project of workflowProjects) {
    const [swatch, ...rest] = await swatches(`@theme {\n  --color-primary: ${project.primary};\n}\n`, workflowProjectClass)
    assert.equal(rest.length, 0, project.directory)
    assert.ok(new Color(project.primary).deltaE(swatch, '2000') < 1, project.directory)
  }
})

test('route stylesheets compile against the project and use the definitions on the floor', () => {
  const floor: string[] = workflowRouteDefinitions.map((definition) => definition.name)
  const used = new Set<string>()
  for (const route of workflowRoutes) {
    const { diagnostics } = compileManifestSync(`${workflowRouteProjectCSS}\n${route.code}\n`, { baseManifest: preset })
    assert.deepEqual(diagnostics.filter((diagnostic) => diagnostic.severity === 'error'), [], route.route)
    const references = workflowRouteReferences(route.code)
    assert.ok(references.length > 0, route.route)
    for (const reference of references) {
      assert.ok(floor.includes(reference), `${route.route} uses ${reference}, which the floor does not show`)
      used.add(reference)
    }
  }
  assert.deepEqual([...used].sort(), [...floor].sort())
})

test('the impact graph follows a token through the inspect --compare report', async () => {
  // Each kind of node is a list in the comparison report, in the order the graph reads.
  const protocol = readFileSync(new URL('packages/binding/src/protocol.ts', repository), 'utf8')
  const comparison = protocol.slice(protocol.indexOf('export interface MasterCSSProjectComparison {'))
  const fields = comparison.slice(0, comparison.indexOf('\n}'))
  const kinds = [...new Set(workflowTraceNodes.map(([, , kind]) => kind))]
  assert.deepEqual(kinds, ['definition', 'class', 'file', 'output'])
  for (const kind of kinds) assert.match(fields, new RegExp(`readonly ${kind === 'class' ? 'classes' : `${kind}s`}:`), kind)
  assert.match(readFileSync(new URL('packages/cli/src/core.ts', repository), 'utf8'), /\.option\('--compare <snapshot>'/)
  // Every class in the graph resolves through the changed token, and every edge moves one column right.
  const source = `@theme {\n  ${workflowTraceChange.token}: ${workflowTraceChange.before};\n}\n`
  for (const [, label, kind] of workflowTraceNodes) {
    if (kind !== 'class') continue
    const [swatch] = await swatches(source, label)
    assert.ok(new Color(workflowTraceChange.before).deltaE(swatch, '2000') < 1, label)
  }
  for (const [from, to] of workflowTraceEdges) assert.equal(workflowTraceNodes[to][0], workflowTraceNodes[from][0] + 1, `${from} -> ${to}`)
  for (const [column, , kind] of workflowTraceNodes) assert.equal(column, kinds.indexOf(kind), kind)
})
