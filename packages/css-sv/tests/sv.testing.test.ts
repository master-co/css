import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { add } from 'sv'
import { createSetupTest } from 'sv/testing'
import { beforeAll, beforeEach, expect, inject, test } from 'vitest'
import addon from '../src'

const addons = {
  'master-css': addon
}

const setupTest = createSetupTest({
  beforeAll,
  beforeEach,
  expect,
  inject,
  test
})

const { test: addonTest, testCases } = setupTest(addons, {
  browser: false,
  kinds: [
    { type: 'empty', options: { 'master-css': {} } },
    { type: 'existing-vite-config', options: { 'master-css': {} } },
    { type: 'existing-hook', options: { 'master-css': {} } },
    { type: 'existing-sequence', options: { 'master-css': {} } },
    { type: 'existing-stylesheet', options: { 'master-css': {} } },
    { type: 'idempotent', options: { 'master-css': {} } }
  ],
  filter: ({ variant }) => variant === 'kit-js' || variant === 'kit-ts',
  preAdd({ addonTestCase, cwd }) {
    ensureLocalDependencyOverrides(cwd)

    const extension = addonTestCase.variant.endsWith('-ts') ? 'ts' : 'js'
    if (addonTestCase.kind.type === 'existing-vite-config') {
      writeFileSync(
        resolve(cwd, `vite.config.${extension}`),
        existingViteConfig(),
        'utf8'
      )
    }

    if (addonTestCase.kind.type === 'existing-hook') {
      writeFileSync(
        resolve(cwd, `src/hooks.server.${extension}`),
        existingHook(extension),
        'utf8'
      )
    }

    if (addonTestCase.kind.type === 'existing-sequence') {
      writeFileSync(
        resolve(cwd, `src/hooks.server.${extension}`),
        existingSequence(extension),
        'utf8'
      )
    }

    if (addonTestCase.kind.type === 'existing-stylesheet') {
      writeFileSync(
        resolve(cwd, 'src/routes/layout.css'),
        "@import '@master/css';\n\nbody { margin: 0; }\n",
        'utf8'
      )
      writeFileSync(
        resolve(cwd, 'src/routes/+layout.svelte'),
        `<script${extension === 'ts' ? ' lang="ts"' : ''}>\n    import './layout.css'\n</script>\n\n{@render children?.()}\n`,
        'utf8'
      )
    }
  }
})

for (const addonTestCase of testCases) {
  addonTest(`${addonTestCase.kind.type} ${addonTestCase.variant}`, async ({ cwd }) => {
    const projectDir = cwd(addonTestCase)
    assertMasterCSSSetup(projectDir, addonTestCase.variant)

    if (addonTestCase.kind.type === 'existing-hook') {
      expect(readProjectFile(projectDir, hookPath(addonTestCase.variant))).toContain('sequence(masterCSSHandle, originalHandle)')
    }

    if (addonTestCase.kind.type === 'existing-vite-config') {
      expect(readProjectFile(projectDir, viteConfigPath(addonTestCase.variant))).toContain('existingPlugin()')
    }

    if (addonTestCase.kind.type === 'existing-sequence') {
      expect(readProjectFile(projectDir, hookPath(addonTestCase.variant))).toContain('sequence(masterCSSHandle, first, second)')
    }

    if (addonTestCase.kind.type === 'existing-stylesheet') {
      expect(countMatches(readProjectFile(projectDir, 'src/routes/layout.css'), "@import '@master/css';")).toBe(1)
      expect(countMatches(readProjectFile(projectDir, 'src/routes/+layout.svelte'), "import './layout.css';")).toBe(1)
    }

    if (addonTestCase.kind.type === 'idempotent') {
      const before = snapshotProjectFiles(projectDir, addonTestCase.variant)
      await add({
        cwd: projectDir,
        addons,
        options: { 'master-css': {} },
        packageManager: 'pnpm'
      })
      expect(snapshotProjectFiles(projectDir, addonTestCase.variant)).toEqual(before)
    }
  })
}

test('marks non-SvelteKit projects unsupported', () => {
  const unsupported: string[] = []
  addon.setup?.({
    isKit: false,
    unsupported: (reason) => unsupported.push(reason)
  } as Parameters<NonNullable<typeof addon.setup>>[0])

  expect(unsupported).toEqual(['Requires SvelteKit'])
})

function assertMasterCSSSetup(projectDir: string, variant: string) {
  const packageJSON = JSON.parse(readProjectFile(projectDir, 'package.json'))
  expect(packageJSON.dependencies['@master/css']).toBe('rc')
  expect(packageJSON.dependencies['@master/css.svelte']).toBe('rc')
  expect(packageJSON.dependencies['@master/css-sv']).toBeUndefined()
  expect(packageJSON.devDependencies?.['@master/css-sv']).toBeUndefined()

  const viteConfig = readProjectFile(projectDir, viteConfigPath(variant))
  expect(viteConfig).toContain("from '@master/css.svelte/vite'")
  expect(viteConfig).toContain('masterCSS()')

  expect(readProjectFile(projectDir, 'src/routes/layout.css')).toContain("@import '@master/css';")
  expect(readProjectFile(projectDir, 'src/routes/+layout.svelte')).toContain("import './layout.css';")

  const hooksServer = readProjectFile(projectDir, hookPath(variant))
  expect(hooksServer).toContain("from '@master/css.svelte/hooks.server'")
  expect(hooksServer).toContain('masterCSSHandle')
  expect(hooksServer).toMatch(/export[\s\S]*const handle/)
}

function ensureLocalDependencyOverrides(cwd: string) {
  const workspaceRoot = dirname(cwd)
  const packageJSONPath = resolve(workspaceRoot, 'package.json')
  const packageJSON = JSON.parse(readFileSync(packageJSONPath, 'utf8'))
  if (packageJSON.pnpm?.overrides?.['@master/css']) return

  writeStubPackage(
    workspaceRoot,
    'stubs/master-css',
    {
      name: '@master/css',
      version: '0.0.0-rc.0',
      exports: './index.css'
    },
    {
      'index.css': '@layer theme, base, defaults, components, utilities;\n'
    }
  )
  writeStubPackage(
    workspaceRoot,
    'stubs/master-css-svelte',
    {
      name: '@master/css.svelte',
      version: '0.0.0-rc.0',
      exports: {
        './vite': './vite.js',
        './hooks.server': './hooks.server.js'
      }
    },
    {
      'vite.js': 'export default function masterCSS() { return { name: "master-css-svelte-stub" } }\n',
      'hooks.server.js': 'export default async function handle({ event, resolve }) { return resolve(event) }\n'
    }
  )

  packageJSON.pnpm = {
    ...packageJSON.pnpm,
    overrides: {
      ...packageJSON.pnpm?.overrides,
      '@master/css': 'file:./stubs/master-css',
      '@master/css.svelte': 'file:./stubs/master-css-svelte'
    }
  }
  writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, 2), 'utf8')
}

function writeStubPackage(
  workspaceRoot: string,
  stubDirectory: string,
  packageJSON: Record<string, unknown>,
  files: Record<string, string>
) {
  const directory = resolve(workspaceRoot, stubDirectory)
  mkdirSync(directory, { recursive: true })
  writeFileSync(resolve(directory, 'package.json'), JSON.stringify({ type: 'module', ...packageJSON }, null, 2), 'utf8')
  for (const [file, content] of Object.entries(files)) {
    writeFileSync(resolve(directory, file), content, 'utf8')
  }
}

function existingHook(extension: string) {
  const typeImport = extension === 'ts' ? "import type { Handle } from '@sveltejs/kit'\n\n" : ''
  const typeAnnotation = extension === 'ts' ? ': Handle' : ''
  return `${typeImport}export const handle${typeAnnotation} = async ({ event, resolve }) => {
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('before', 'after')
  })
}
`
}

function existingSequence(extension: string) {
  const typeImport = extension === 'ts' ? "import type { Handle } from '@sveltejs/kit'\n" : ''
  const typeAnnotation = extension === 'ts' ? ': Handle' : ''
  return `import { sequence } from '@sveltejs/kit/hooks'
${typeImport}
const first${typeAnnotation} = async ({ event, resolve }) => resolve(event)
const second${typeAnnotation} = async ({ event, resolve }) => resolve(event)
export const handle = sequence(first, second)
`
}

function existingViteConfig() {
  return `import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

const existingPlugin = () => ({ name: 'existing-plugin' })

export default defineConfig({
  plugins: [
    existingPlugin(),
    sveltekit()
  ]
})
`
}

function hookPath(variant: string) {
  return `src/hooks.server.${variant.endsWith('-ts') ? 'ts' : 'js'}`
}

function viteConfigPath(variant: string) {
  return `vite.config.${variant.endsWith('-ts') ? 'ts' : 'js'}`
}

function snapshotProjectFiles(projectDir: string, variant: string) {
  return {
    package: readProjectFile(projectDir, 'package.json'),
    vite: readProjectFile(projectDir, viteConfigPath(variant)),
    stylesheet: readProjectFile(projectDir, 'src/routes/layout.css'),
    layout: readProjectFile(projectDir, 'src/routes/+layout.svelte'),
    hooks: readProjectFile(projectDir, hookPath(variant))
  }
}

function readProjectFile(projectDir: string, file: string) {
  return readFileSync(resolve(projectDir, file), 'utf8')
}

function countMatches(content: string, search: string) {
  return content.split(search).length - 1
}
