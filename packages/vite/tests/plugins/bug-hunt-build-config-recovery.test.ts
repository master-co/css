import { mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BuildEnvironment, build, createBuilder, type Plugin, type ResolvedConfig } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'
import { watchDeadline } from '../watch-deadline-helper'

function files(directory: string): string[] {
  try { return readdirSync(directory, { recursive: true }).map(String).filter(name => name.endsWith('invalidate')) } catch { return [] }
}

for (const mode of ['static', 'runtime', 'pre-render', 'progressive'] as const) {
  for (const failure of ['config-sync', 'config-async', 'factory', 'environment-init'] as const) {
    test(`failed ${failure} bounds recovery material to one run (${mode})`, async () => {
      const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-build-config-lifetime-'))), cacheDir = join(root, '.vite')
      const error = new Error(`intentional ${failure}`)
      const failing: Plugin = {
        name: 'config-lifetime-failure',
        configResolved: failure === 'config-sync' ? () => { throw error } : failure === 'config-async' ? async () => { await Promise.resolve();throw error } : undefined,
        applyToEnvironment: failure === 'environment-init' ? async () => { throw error } : undefined
      }
      const failed = () => expect(build({ root, cacheDir, configFile: false, logLevel: 'silent',
        plugins: [masterCSS({ mode, runtime: false }), failing], build: { watch: {},
          ...(failure === 'factory' ? { createEnvironment() { throw error } } : {})
        }
      })).rejects.toThrow(error.message)
      try {
        // Configuration allocates before the host can say whether the build
        // will start, and no hook runs after it fails there, so the material
        // outlives the run. The next run reclaims it rather than accumulating.
        await failed()
        expect(files(cacheDir)).toHaveLength(1)
        await failed()
        expect(files(cacheDir)).toHaveLength(1)
      } finally { rmSync(root, { recursive: true, force: true }) }
    })
  }

  test(`custom build environment initialization and watch ownership survive (${mode})`, async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-build-custom-environment-'))), cacheDir = join(root, '.vite')
    const calls: string[] = []
    let watcher: { close(): Promise<void> } | undefined
    class CustomEnvironment extends BuildEnvironment {
      async init() { calls.push('init');await super.init();calls.push('ready') }
    }
    try {
      writeFileSync(join(root, 'entry.js'), 'export const value=1')
      const result = await build({ root, cacheDir, configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode, runtime: false })],
        build: { watch: {}, minify: false, createEnvironment(name, config) { calls.push(name);return new CustomEnvironment(name, config) },
          rolldownOptions: { input: join(root, 'entry.js') }
        }
      })
      if (!('on' in result)) throw new Error('Expected watch build')
      watcher = result
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Initial build timeout')), watchDeadline)
        result.on('event', event => {
          if (event.code === 'ERROR') { clearTimeout(timeout);reject(event.error) }
          if (event.code === 'BUNDLE_END') { clearTimeout(timeout);resolve() }
        })
      })
      expect(calls).toEqual(['client', 'init', 'ready'])
      expect(files(cacheDir)).toHaveLength(1)
      await watcher.close()
      expect(files(cacheDir)).toEqual([])
    } finally { await watcher?.close();rmSync(root, { recursive: true, force: true }) }
  })
}

for (const shared of [true, false]) for (const failure of ['factory', 'init'] as const) {
  test(`configuration bounds recovery material when a peer ${failure} fails (shared=${shared})`, async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-build-peer-failure-'))), cacheDir = join(root, '.vite')
    const error = new Error(`intentional peer ${failure}`)
    const createEnvironment = (name: string, config: ResolvedConfig) => {
      if (name === 'ssr' && failure === 'factory') throw error
      const environment = new BuildEnvironment(name, config)
      if (name === 'ssr' && failure === 'init') environment.init = async () => { throw error }
      return environment
    }
    const failed = () => expect(createBuilder({ root, cacheDir, configFile: false, logLevel: 'silent',
      plugins: [masterCSS({ mode: 'static', runtime: false })],
      builder: { sharedConfigBuild: shared },
      environments: { client: { build: { createEnvironment } }, ssr: { consumer: 'server', build: { createEnvironment } } },
      build: { watch: {}, createEnvironment }
    })).rejects.toThrow(error.message)
    try {
      await failed()
      expect(files(cacheDir)).toHaveLength(1)
      await failed()
      expect(files(cacheDir)).toHaveLength(1)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
}
