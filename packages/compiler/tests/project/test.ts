import { expect, test } from 'vitest'
import {
  compileProjectManifest,
  loadProjectManifest
} from '../../src/project/manifest'
import {
  compileProjectManifestSync,
  loadProjectManifestSync
} from '../../src/project/manifest-sync'
import {
  findCSSManifestEntryFiles,
  findMasterCSSWorkspaceDirectories,
  hasMasterCSSManifestEntrypoint,
  resolveMasterCSSPackageEntryFile
} from '../../src/project/entries'
import {
  isCompatibleMasterCSSPackageVersion,
  resolveMasterCSSWorkspacePackages
} from '@master/css-internal/workspace'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, sep } from 'node:path'
import { tmpdir } from 'node:os'
import {
  flattenMasterCSSManifestVariables,
  serializeMasterCSSManifest,
  type MasterCSSManifest
} from '@master/css-schema/manifest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function createFixture() {
  return mkdtempSync(join(tmpdir(), 'master-css-manifester-'))
}

function isSameOrChildPath(parentPath: string, childPath: string) {
  const relativePath = relative(parentPath, childPath)
  return relativePath === ''
    || (
      !!relativePath
      && relativePath !== '..'
      && !relativePath.startsWith(`..${sep}`)
      && !isAbsolute(relativePath)
    )
}

function writeCSSFixture(cwd: string) {
  mkdirSync(join(cwd, 'styles'), { recursive: true })
  const entry = join(cwd, 'index.css')
  const tokens = join(cwd, 'styles', 'tokens.css')
  writeFileSync(tokens, `
    @theme {
      --color-primary: #123;
    }
  `)
  writeFileSync(entry, `
    @master entry;
    @import './styles/tokens.css';

    @components {
      btn {
        color: var(--color-primary);
        display: inline-flex;
      }
    }
  `)
  return { entry, tokens }
}

function writeJSON(file: string, value: unknown) {
  writeFileSync(file, JSON.stringify(value, null, 2))
}

function toPackagePath(packageName: string) {
  return join(...packageName.split('/'))
}

function writeNodePackage(
  root: string,
  packageName: string,
  packageJSON: Record<string, unknown>,
  files: Record<string, string> = { 'index.js': 'export default {}' }
) {
  const packageDir = join(root, 'node_modules', toPackagePath(packageName))
  mkdirSync(packageDir, { recursive: true })
  writeJSON(join(packageDir, 'package.json'), {
    name: packageName,
    type: 'module',
    version: '1.2.3',
    exports: {
      '.': './index.js'
    },
    ...packageJSON
  })
  for (const [file, source] of Object.entries(files)) {
    writeFileSync(join(packageDir, file), source)
  }
  return packageDir
}

test('compiles explicit CSS project entries', async () => {
  const cwd = createFixture()
  try {
    const { entry, tokens } = writeCSSFixture(cwd)

    const result = await compileProjectManifest({
      root: cwd,
      entries: [entry],
      baseManifest: defaultManifest
    })
    expect(result).toMatchObject({
      dependencies: [
        entry,
        tokens
      ]
    })
    expect(result.manifest.version).toBe(1)
    expect(flattenMasterCSSManifestVariables(result.manifest.variables)).toContainEqual(expect.objectContaining({
      name: 'color-primary',
      namespace: 'color',
      key: 'primary',
      value: '#123'
    }))
    expect(result.manifest.utilities).toContainEqual(expect.objectContaining({
      name: 'btn',
      layer: 'components',
    }))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('loads CSS manifest resources', async () => {
  const cwd = createFixture()
  try {
    const { entry, tokens } = writeCSSFixture(cwd)

    const result = await compileProjectManifest({
      root: cwd,
      entries: [entry],
      baseManifest: defaultManifest
    })
    expect(result).toMatchObject({
      dependencies: [
        entry,
        tokens
      ]
    })
    expect(result.manifest.version).toBe(1)
    expect(flattenMasterCSSManifestVariables(result.manifest.variables)).toContainEqual(expect.objectContaining({
      name: 'color-primary',
      namespace: 'color',
      key: 'primary',
      value: '#123'
    }))
    expect(result.manifest.utilities).toContainEqual(expect.objectContaining({
      name: 'btn',
      layer: 'components',
    }))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('compiles explicit CSS project entries synchronously', () => {
  const cwd = createFixture()
  try {
    const { entry, tokens } = writeCSSFixture(cwd)

    const result = compileProjectManifestSync({
      root: cwd,
      entries: [entry],
      baseManifest: defaultManifest
    })
    expect(result).toMatchObject({
      dependencies: [
        entry,
        tokens
      ]
    })
    expect(result.manifest.version).toBe(1)
    expect(flattenMasterCSSManifestVariables(result.manifest.variables)).toContainEqual(expect.objectContaining({
      name: 'color-primary',
      namespace: 'color',
      key: 'primary',
      value: '#123'
    }))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('loads CSS manifest resources synchronously', () => {
  const cwd = createFixture()
  try {
    const { entry, tokens } = writeCSSFixture(cwd)

    const result = compileProjectManifestSync({
      root: cwd,
      entries: [entry],
      baseManifest: defaultManifest
    })
    expect(result).toMatchObject({
      dependencies: [
        entry,
        tokens
      ]
    })
    expect(result.manifest.version).toBe(1)
    expect(flattenMasterCSSManifestVariables(result.manifest.variables)).toContainEqual(expect.objectContaining({
      name: 'color-primary',
      namespace: 'color',
      key: 'primary',
      value: '#123'
    }))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('loads package entry preset manifest from CSS imports', async () => {
  const cwd = createFixture()
  try {
    const entry = join(cwd, 'index.css')
    writeFileSync(entry, `
      @import "@master/css";

      @components {
        card {
          @variant sm {
            color: red;
          }
        }
      }
    `)

    const result = await compileProjectManifest({
      root: cwd,
      entries: [entry],
      baseManifest: defaultManifest
    })
    const packageEntry = resolveMasterCSSPackageEntryFile('@master/css', entry, cwd)
    expect(packageEntry).toBeTruthy()
    if (!packageEntry) throw new Error('Expected Master CSS package entry')
    expect(result.dependencies).toContain(packageEntry)
    const packageDependencies = result.dependencies
      .filter((dependency: string) => !isSameOrChildPath(cwd, dependency))
    expect(packageDependencies.length).toBeGreaterThan(1)
    expect(flattenMasterCSSManifestVariables(result.manifest.variables)).toContainEqual(expect.objectContaining({
      name: 'breakpoint-sm',
      namespace: 'breakpoint',
      key: 'sm',
      type: 'number',
      value: '52.125rem',
      numeric: { value: 52.125, unit: 'rem' }
    }))
    expect(result.manifest.breakpointConditions?.sm).toMatchObject({
      id: 'media',
      nodes: [expect.objectContaining({ type: 'number', value: 52.125, unit: 'rem' })]
    })
    expect(result.manifest.utilities).toContainEqual(expect.objectContaining({
      name: 'card',
    }))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('loads project-level CSS manifest entries', async () => {
  const cwd = createFixture()
  try {
    const { entry } = writeCSSFixture(cwd)
    writeFileSync(join(cwd, 'ignored.css'), `
      @preserve native;
      @layer components {
        .ignored {
          color: red;
        }
      }
    `)

    expect(hasMasterCSSManifestEntrypoint('@master entry;')).toBe(true)
    expect(hasMasterCSSManifestEntrypoint('@master;')).toBe(false)
    expect(hasMasterCSSManifestEntrypoint('@master global;')).toBe(false)
    expect(hasMasterCSSManifestEntrypoint('@preserve native;')).toBe(false)
    expect(hasMasterCSSManifestEntrypoint('@import "@master/css/index.css";')).toBe(false)
    await expect(findCSSManifestEntryFiles(cwd)).resolves.toStrictEqual([entry])

    const result = await loadProjectManifest({
      root: cwd,
      baseManifest: defaultManifest
    })
    const syncResult = loadProjectManifestSync({
      root: cwd,
      baseManifest: defaultManifest
    })

    expect(result.entries).toStrictEqual([entry])
    expect(syncResult.manifest).toStrictEqual(result.manifest)
    expect(result.manifest.utilities).toContainEqual(expect.objectContaining({
      name: 'btn'
    }))
    expect(result.manifest.utilities).not.toContainEqual(expect.objectContaining({
      name: 'ignored'
    }))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('finds Master CSS workspace directories from package and CSS entries', async () => {
  const cwd = createFixture()
  try {
    mkdirSync(join(cwd, 'packages', 'app'), { recursive: true })
    mkdirSync(join(cwd, 'docs', 'styles'), { recursive: true })
    writeFileSync(join(cwd, 'packages', 'app', 'package.json'), JSON.stringify({
      dependencies: {
        '@master/css': 'workspace:*'
      }
    }))
    writeFileSync(join(cwd, 'packages', 'app', 'index.css'), '@master entry;')
    writeFileSync(join(cwd, 'docs', 'styles', 'global.css'), '@import "@master/css";')

    await expect(findMasterCSSWorkspaceDirectories(cwd)).resolves.toStrictEqual([
      cwd,
      join(cwd, 'docs', 'styles'),
      join(cwd, 'packages', 'app')
    ])
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('does not match sibling workspace path prefixes', async () => {
  const cwd = createFixture()
  try {
    mkdirSync(join(cwd, 'packages', 'app'), { recursive: true })
    mkdirSync(join(cwd, 'packages', 'app-kit'), { recursive: true })
    writeFileSync(join(cwd, 'packages', 'app', 'package.json'), JSON.stringify({
      dependencies: {
        '@master/css': 'workspace:*'
      }
    }))
    writeFileSync(join(cwd, 'packages', 'app-kit', 'index.css'), '@master entry;')

    await expect(findMasterCSSWorkspaceDirectories(cwd)).resolves.toStrictEqual([
      cwd,
      join(cwd, 'packages', 'app'),
      join(cwd, 'packages', 'app-kit')
    ])
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('resolves Master CSS workspace packages and optional language server', () => {
  const cwd = createFixture()
  try {
    writeJSON(join(cwd, 'package.json'), {
      dependencies: {
        '@master/css': '^1.2.3',
        '@master/css-language-server': '^1.2.3'
      }
    })
    const cssDir = writeNodePackage(cwd, '@master/css', {
      dependencies: {
        '@master/css-preset': '^1.2.3'
      }
    }, {
      'index.js': 'export const builtinKeyAliases = {}; export const builtinNativeValueNamespaces = []'
    })
    const presetDir = writeNodePackage(cssDir, '@master/css-preset', {
      exports: {
        './default-manifest.json': './default-manifest.json'
      }
    }, {
      'default-manifest.json': '{"version":1}'
    })
    const languageServerDir = writeNodePackage(cwd, '@master/css-language-server', {
      exports: {
        './server': './server.js'
      }
    }, {
      'server.js': 'export {}'
    })

    const resolution = resolveMasterCSSWorkspacePackages(cwd)

    expect(realpathSync(resolution.css?.directory || '')).toBe(realpathSync(cssDir))
    expect(realpathSync(resolution.presetManifest?.directory || '')).toBe(realpathSync(presetDir))
    expect(realpathSync(resolution.languageServer?.directory || '')).toBe(realpathSync(languageServerDir))
    expect(resolution.errors).toEqual([])
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('reports a missing workspace preset without throwing', () => {
  const cwd = createFixture()
  try {
    writeJSON(join(cwd, 'package.json'), {
      dependencies: {
        '@master/css': '^1.2.3'
      }
    })
    const cssDir = writeNodePackage(cwd, '@master/css', {})
    writeNodePackage(cssDir, '@master/css-preset', {
      exports: {
        './default-manifest.json': './missing.json'
      }
    }, {})

    const resolution = resolveMasterCSSWorkspacePackages(cwd)

    expect(realpathSync(resolution.css?.directory || '')).toBe(realpathSync(cssDir))
    expect(resolution.presetManifest).toBeUndefined()
    expect(resolution.errors.map(({ name }) => name)).toEqual([
      '@master/css-preset/default-manifest.json'
    ])
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('reports missing workspace runtime packages without throwing', () => {
  const cwd = createFixture()
  try {
    writeJSON(join(cwd, 'package.json'), {
      dependencies: {
        '@master/css': '^1.2.3'
      }
    })
    const cssDir = writeNodePackage(cwd, '@master/css', {})
    writeNodePackage(cssDir, '@master/css-preset', {
      exports: {
        './default-manifest.json': './missing.json'
      }
    }, {})

    const resolution = resolveMasterCSSWorkspacePackages(cwd)

    expect(realpathSync(resolution.css?.directory || '')).toBe(realpathSync(cssDir))
    expect(resolution.presetManifest).toBeUndefined()
    expect(resolution.errors.map(({ name }) => name)).toEqual([
      '@master/css-preset/default-manifest.json'
    ])
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('reports invalid package exports as resolution errors', () => {
  const cwd = createFixture()
  try {
    writeJSON(join(cwd, 'package.json'), {
      dependencies: {
        '@master/css': '^1.2.3'
      }
    })
    writeNodePackage(cwd, '@master/css', {
      exports: {
        '.': './missing.js'
      }
    }, {})

    const resolution = resolveMasterCSSWorkspacePackages(cwd)

    expect(resolution.css).toBeUndefined()
    expect(resolution.errors[0]).toMatchObject({
      name: '@master/css'
    })
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('checks compatible package majors when versions are known', () => {
  expect(isCompatibleMasterCSSPackageVersion('2.1.0', '^2.0.0')).toBe(true)
  expect(isCompatibleMasterCSSPackageVersion('3.0.0', '^2.0.0')).toBe(false)
  expect(isCompatibleMasterCSSPackageVersion(undefined, '^2.0.0')).toBe(true)
  expect(isCompatibleMasterCSSPackageVersion('3.0.0', undefined)).toBe(true)
})

test('serializes project manifests through the schema codec', async () => {
  const cwd = createFixture()
  try {
    const { entry } = writeCSSFixture(cwd)
    const result = await compileProjectManifest({
      root: cwd,
      entries: [entry],
      baseManifest: defaultManifest
    })
    const syncResult = compileProjectManifestSync({
      root: cwd,
      entries: [entry],
      baseManifest: defaultManifest
    })
    const json = serializeMasterCSSManifest(result.manifest)
    const syncJSON = serializeMasterCSSManifest(syncResult.manifest)

    expect(json).toContain('"version":1')
    expect(JSON.parse(json).version).toBe(1)
    expect(syncJSON).toBe(json)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('turns CSS manifest results into JSON sources', async () => {
  const cwd = createFixture()
  try {
    const { entry } = writeCSSFixture(cwd)
    const result = await compileProjectManifest({
      root: cwd,
      entries: [entry],
      baseManifest: defaultManifest
    })
    const syncResult = compileProjectManifestSync({
      root: cwd,
      entries: [entry],
      baseManifest: defaultManifest
    })
    const json = serializeMasterCSSManifest(result.manifest)
    const syncJSON = serializeMasterCSSManifest(syncResult.manifest)

    expect(json).toContain('"version":1')
    expect(JSON.parse(json).version).toBe(1)
    expect(syncJSON).toBe(json)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('rejects script config paths', async () => {
  const cwd = createFixture()
  try {
    const script = join(cwd, 'config.ts')
    writeFileSync(script, 'export default {}')

    await expect(compileProjectManifest({
      root: cwd,
      entries: [script],
      baseManifest: defaultManifest
    })).rejects.toThrow('CSS files')
    expect(() => compileProjectManifestSync({
      root: cwd,
      entries: [script],
      baseManifest: defaultManifest
    })).toThrow('CSS files')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
