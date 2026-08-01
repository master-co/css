import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'
import {
  applyMasterCSSSetupPlan,
  planMasterCSSSetup,
  type MasterCSSSetupOptions
} from '../src'

function applySetup(options: MasterCSSSetupOptions = {}) {
  const plan = planMasterCSSSetup(options)
  applyMasterCSSSetupPlan(plan, options)
  return plan
}

function formatPlannedCommand(command: { executable: string, args: readonly string[] }) {
  return [command.executable, ...command.args].join(' ')
}
import { resolveCommandOptions } from '../src/core'
import { addMasterCSSEslintConfig } from '../src/transforms'

const cliFilepath = resolve(__dirname, '../src/bin/index.ts')
const tsconfigPath = resolve(__dirname, '../../../tsconfig.json')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href

function createTempProject(name: string, packageJSON: Record<string, unknown> = {}) {
  const root = mkdtempSync(join(tmpdir(), name))
  writeFileSync(join(root, 'package.json'), JSON.stringify({
    name,
    type: 'module',
    dependencies: {},
    devDependencies: {},
    ...packageJSON
  }, null, 4), 'utf8')
  return root
}

function readProjectFile(root: string, file: string) {
  return readFileSync(join(root, file), 'utf8')
}

function writeProjectFile(root: string, file: string, content: string) {
  const filePath = join(root, file)
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, 'utf8')
}

function runCLI(args: string[], options: { cwd?: string, env?: NodeJS.ProcessEnv } = {}) {
  return spawnSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, ...args], {
    cwd: options.cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(options.env || {}),
      TSX_TSCONFIG_PATH: tsconfigPath
    }
  })
}

function createFakePackageManager(name: string) {
  const root = mkdtempSync(join(tmpdir(), 'master-css-create-pm-'))
  const marker = join(root, 'install.log')
  const binary = join(root, name)
  const windowsBinary = join(root, `${name}.cmd`)
  const shim = join(root, `${name}.cjs`)
  const envKey = pathEnvKey()
  writeFileSync(shim, `const { realpathSync, writeFileSync } = require('node:fs')
writeFileSync(${JSON.stringify(marker)}, \`\${realpathSync(process.cwd())} \${process.argv.slice(2).join(' ')}\`)
`, 'utf8')
  writeFileSync(binary, `#!/bin/sh
exec ${JSON.stringify(process.execPath)} ${JSON.stringify(shim)} "$@"
`, 'utf8')
  writeFileSync(windowsBinary, `@echo off\r\n"${process.execPath}" "${shim}" %*\r\n`, 'utf8')
  chmodSync(binary, 0o755)
  return {
    root,
    marker,
    env: {
      [envKey]: `${root}${delimiter}${process.env[envKey] || ''}`
    }
  }
}

function pathEnvKey() {
  if (process.platform !== 'win32') return 'PATH'
  return Object.keys(process.env).find((key) => key.toLowerCase() === 'path') || 'Path'
}

describe('@master/create-css setup planner', () => {
  test('plans TanStack Start Vite projects before generic React', () => {
    const root = createTempProject('master-css-create-tanstack-start-', {
      dependencies: {
        '@tanstack/react-router': '^1.170.0',
        '@tanstack/react-start': '^1.168.0',
        '@vitejs/plugin-react': '^6.0.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        vite: '^8.0.0'
      }
    })
    writeProjectFile(root, 'vite.config.ts', `import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart(),
    react()
  ]
})
`)
    writeProjectFile(root, 'src/routes/__root.tsx', `import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent
})

function RootComponent() {
  return <Outlet />
}
`)

    const plan = planMasterCSSSetup({ root })

    expect(plan.framework).toBe('tanstack-start')
    expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
      '@master/css',
      '@master/css-vite',
      '@master/eslint-config-css',
      'eslint',
      '@master/css-mcp'
    ])
    expect(plan.files.map((file) => [file.path, file.action])).toEqual([
      ['vite.config.ts', 'update'],
      ['src/styles/app.css', 'create'],
      ['src/routes/__root.tsx', 'update'],
      ['eslint.config.js', 'create'],
      ['AGENTS.md', 'create']
    ])

    applySetup({ root, install: false })

    const viteConfig = readProjectFile(root, 'vite.config.ts')
    expect(viteConfig).toContain("import masterCSS from '@master/css-vite'")
    expect(viteConfig).toContain("masterCSS({ mode: 'runtime' })")
    expect(viteConfig.indexOf('tanstackStart()')).toBeLessThan(viteConfig.indexOf("masterCSS({ mode: 'runtime' })"))
    expect(viteConfig.indexOf("masterCSS({ mode: 'runtime' })")).toBeLessThan(viteConfig.indexOf('react()'))
    expect(readProjectFile(root, 'src/styles/app.css')).toBe("@import '@master/css';\n")
    expect(readProjectFile(root, 'src/routes/__root.tsx')).toContain("import '../styles/app.css'")
  })

  test('writes explicit static mode for TanStack Start setup', () => {
    const root = createTempProject('master-css-create-tanstack-start-static-mode-', {
      dependencies: {
        '@tanstack/react-start': '^1.168.0',
        '@vitejs/plugin-react': '^6.0.0',
        react: '^19.0.0',
        vite: '^8.0.0'
      }
    })
    writeProjectFile(root, 'vite.config.ts', `import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart(),
    react()
  ]
})
`)

    applySetup({
      root,
      framework: 'tanstack-start',
      mode: 'static',
      minimal: true,
      install: false
    })

    const viteConfig = readProjectFile(root, 'vite.config.ts')
    expect(viteConfig).toContain("masterCSS({ mode: 'static' })")
    expect(viteConfig.indexOf('tanstackStart()')).toBeLessThan(viteConfig.indexOf("masterCSS({ mode: 'static' })"))
    expect(viteConfig.indexOf("masterCSS({ mode: 'static' })")).toBeLessThan(viteConfig.indexOf('react()'))
  })

  test('allows explicit TanStack Start setup without framework auto detection', () => {
    const root = createTempProject('master-css-create-tanstack-start-explicit-')

    const plan = planMasterCSSSetup({
      root,
      framework: 'tanstack-start',
      minimal: true
    })

    expect(plan.framework).toBe('tanstack-start')
    expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
      '@master/css',
      '@master/css-vite'
    ])
    expect(plan.files.map((file) => [file.path, file.action])).toEqual([
      ['vite.config.ts', 'create'],
      ['src/styles/app.css', 'create']
    ])
    expect(plan.warnings).toEqual([
      'No src/routes/__root.tsx, src/routes/__root.jsx, src/routes/__root.ts, or src/routes/__root.js file was found. Import ../styles/app.css from the TanStack Start root route manually after setup.'
    ])
  })

  test('applies idempotent TanStack Start root CSS imports', () => {
    const root = createTempProject('master-css-create-tanstack-start-idempotent-', {
      dependencies: {
        '@tanstack/react-start': '^1.168.0',
        react: '^19.0.0',
        vite: '^8.0.0'
      }
    })
    writeProjectFile(root, 'src/routes/__root.tsx', `import { Outlet } from '@tanstack/react-router'

export default function Root() {
  return <Outlet />
}
`)

    applySetup({ root, install: false })
    const once = {
      root: readProjectFile(root, 'src/routes/__root.tsx'),
      css: readProjectFile(root, 'src/styles/app.css'),
      vite: readProjectFile(root, 'vite.config.ts')
    }

    applySetup({ root, install: false })

    expect({
      root: readProjectFile(root, 'src/routes/__root.tsx'),
      css: readProjectFile(root, 'src/styles/app.css'),
      vite: readProjectFile(root, 'vite.config.ts')
    }).toEqual(once)
  })

  test('plans Rspack projects with the Webpack-compatible plugin before generic React', () => {
    const root = createTempProject('master-css-create-rspack-', {
      dependencies: {
        '@rspack/core': '^2.0.0',
        '@rspack/cli': '^2.0.0',
        react: '^19.0.0'
      }
    })
    writeProjectFile(root, 'rspack.config.mjs', `export default {
  plugins: []
}
`)
    writeProjectFile(root, 'src/index.css', 'body { margin: 0; }\n')

    const plan = planMasterCSSSetup({ root })

    expect(plan.framework).toBe('rspack')
    expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
      '@master/css',
      '@master/css-webpack',
      '@master/eslint-config-css',
      'eslint',
      '@master/css-mcp'
    ])
    expect(plan.dependencies.map((dependency) => dependency.name)).not.toContain('webpack')
    expect(plan.files.map((file) => [file.path, file.action])).toEqual([
      ['rspack.config.mjs', 'update'],
      ['src/index.css', 'update'],
      ['eslint.config.js', 'create'],
      ['AGENTS.md', 'create']
    ])

    applySetup({ root, install: false })

    expect(readProjectFile(root, 'rspack.config.mjs')).toContain("import MasterCSSPlugin from '@master/css-webpack'")
    expect(readProjectFile(root, 'rspack.config.mjs')).toContain('new MasterCSSPlugin()')
    expect(readProjectFile(root, 'src/index.css')).toContain("@import '@master/css';")
  })

  test('applies idempotent explicit Rspack setup with fallback config', () => {
    const root = createTempProject('master-css-create-rspack-explicit-')

    applySetup({
      root,
      framework: 'rspack',
      minimal: true,
      install: false
    })
    const once = {
      config: readProjectFile(root, 'rspack.config.mjs'),
      css: readProjectFile(root, 'src/index.css'),
      packageJSON: readProjectFile(root, 'package.json')
    }

    applySetup({
      root,
      framework: 'rspack',
      minimal: true,
      install: false
    })

    expect({
      config: readProjectFile(root, 'rspack.config.mjs'),
      css: readProjectFile(root, 'src/index.css'),
      packageJSON: readProjectFile(root, 'package.json')
    }).toEqual(once)
    expect(once.config).toContain("type: 'css/auto'")
  })

  test('plans Rsbuild projects with tools.rspack before generic Vue', () => {
    const root = createTempProject('master-css-create-rsbuild-', {
      dependencies: {
        '@rsbuild/core': '^2.0.0',
        vue: '^3.5.0'
      }
    })
    writeProjectFile(root, 'rsbuild.config.ts', `import { defineConfig } from '@rsbuild/core'

export default defineConfig({
  plugins: []
})
`)

    const plan = planMasterCSSSetup({ root })

    expect(plan.framework).toBe('rsbuild')
    expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
      '@master/css',
      '@master/css-webpack',
      '@master/eslint-config-css',
      'eslint',
      '@master/css-mcp'
    ])
    expect(plan.dependencies.map((dependency) => dependency.name)).not.toContain('webpack')
    expect(plan.files.map((file) => [file.path, file.action])).toEqual([
      ['rsbuild.config.ts', 'update'],
      ['src/index.css', 'create'],
      ['eslint.config.js', 'create'],
      ['AGENTS.md', 'create']
    ])

    applySetup({ root, install: false })

    expect(readProjectFile(root, 'rsbuild.config.ts')).toContain("import MasterCSSPlugin from '@master/css-webpack'")
    expect(readProjectFile(root, 'rsbuild.config.ts')).toContain('tools: {')
    expect(readProjectFile(root, 'rsbuild.config.ts')).toContain('rspack(config)')
    expect(readProjectFile(root, 'rsbuild.config.ts')).toContain('config.plugins.push(new MasterCSSPlugin())')
    expect(readProjectFile(root, 'src/index.css')).toBe("@import '@master/css';\n")
  })

  test('applies idempotent explicit Rsbuild setup with fallback config', () => {
    const root = createTempProject('master-css-create-rsbuild-explicit-')

    applySetup({
      root,
      framework: 'rsbuild',
      minimal: true,
      install: false
    })
    const once = {
      config: readProjectFile(root, 'rsbuild.config.ts'),
      css: readProjectFile(root, 'src/index.css'),
      packageJSON: readProjectFile(root, 'package.json')
    }

    applySetup({
      root,
      framework: 'rsbuild',
      minimal: true,
      install: false
    })

    expect({
      config: readProjectFile(root, 'rsbuild.config.ts'),
      css: readProjectFile(root, 'src/index.css'),
      packageJSON: readProjectFile(root, 'package.json')
    }).toEqual(once)
    expect(once.config).toContain("import { defineConfig } from '@rsbuild/core'")
  })

  test('plans Webpack projects with the Webpack plugin before generic setup', () => {
    const root = createTempProject('master-css-create-webpack-', {
      dependencies: {
        webpack: '^5.0.0',
        react: '^19.0.0'
      }
    })
    writeProjectFile(root, 'webpack.config.mjs', `export default {
  plugins: []
}
`)

    const plan = planMasterCSSSetup({ root })

    expect(plan.framework).toBe('webpack')
    expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
      '@master/css',
      '@master/css-webpack',
      '@master/eslint-config-css',
      'eslint',
      '@master/css-mcp'
    ])
    expect(plan.dependencies.map((dependency) => dependency.name)).not.toContain('webpack')
    expect(plan.files.map((file) => [file.path, file.action])).toEqual([
      ['webpack.config.mjs', 'update'],
      ['src/index.css', 'create'],
      ['eslint.config.js', 'create'],
      ['AGENTS.md', 'create']
    ])

    applySetup({ root, install: false })

    expect(readProjectFile(root, 'webpack.config.mjs')).toContain("import MasterCSSPlugin from '@master/css-webpack'")
    expect(readProjectFile(root, 'webpack.config.mjs')).toContain('new MasterCSSPlugin()')
    expect(readProjectFile(root, 'src/index.css')).toBe("@import '@master/css';\n")
  })

  test('writes Webpack rendering modes into fallback and existing configs', () => {
    const fallbackRoot = createTempProject('master-css-create-webpack-static-mode-')
    applySetup({
      root: fallbackRoot,
      framework: 'webpack',
      mode: 'static',
      minimal: true,
      install: false
    })

    expect(readProjectFile(fallbackRoot, 'webpack.config.mjs')).toContain("new MasterCSSPlugin({ mode: 'static' })")
    expect(readProjectFile(fallbackRoot, 'src/index.css')).toBe("@import '@master/css';\n")

    const pluginsRoot = createTempProject('master-css-create-webpack-runtime-mode-')
    writeProjectFile(pluginsRoot, 'webpack.config.mjs', `export default {
  plugins: []
}
`)
    applySetup({
      root: pluginsRoot,
      framework: 'webpack',
      mode: 'runtime',
      minimal: true,
      install: false
    })

    expect(readProjectFile(pluginsRoot, 'webpack.config.mjs')).toContain("new MasterCSSPlugin({ mode: 'runtime' })")

    const exportDefaultRoot = createTempProject('master-css-create-webpack-export-default-mode-')
    writeProjectFile(exportDefaultRoot, 'webpack.config.mjs', `export default {}
`)
    applySetup({
      root: exportDefaultRoot,
      framework: 'webpack',
      mode: 'static',
      minimal: true,
      install: false
    })

    expect(readProjectFile(exportDefaultRoot, 'webpack.config.mjs')).toContain("plugins: [new MasterCSSPlugin({ mode: 'static' })]")
  })

  test('plans Laravel projects with the Vite plugin in static mode', () => {
    const root = createTempProject('master-css-create-laravel-', {
      dependencies: {
        'laravel-vite-plugin': '^3.0.0',
        vite: '^8.0.0'
      }
    })
    writeProjectFile(root, 'vite.config.ts', `import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/app.css']
    })
  ]
})
`)

    applySetup({ root, install: false })

    expect(readProjectFile(root, 'vite.config.ts')).toContain("masterCSS({ mode: 'static' })")
    expect(readProjectFile(root, 'resources/css/app.css')).toBe("@import '@master/css';\n")
  })

  test('allows only static rendering mode for Laravel setup', () => {
    const root = createTempProject('master-css-create-laravel-mode-', {
      dependencies: {
        'laravel-vite-plugin': '^3.0.0',
        vite: '^8.0.0'
      }
    })
    writeProjectFile(root, 'vite.config.ts', `import { defineConfig } from 'vite'

export default defineConfig({
  plugins: []
})
`)

    const staticPlan = planMasterCSSSetup({
      root,
      framework: 'laravel',
      mode: 'static',
      minimal: true
    })

    expect(staticPlan.mode).toBe('static')
    expect(staticPlan.files.find((file) => file.path === 'vite.config.ts')?.content).toContain("masterCSS({ mode: 'static' })")
    expect(() => planMasterCSSSetup({
      root,
      framework: 'laravel',
      mode: 'runtime',
      minimal: true
    })).toThrow('--mode runtime is not supported for laravel')
  })

  test('plans Lit projects with runtime client types and shadow-root setup', () => {
    const root = createTempProject('master-css-create-lit-', {
      dependencies: {
        lit: '^3.0.0',
        vite: '^8.0.0'
      }
    })
    writeProjectFile(root, 'vite.config.ts', `import { defineConfig } from 'vite'

export default defineConfig({})
`)
    writeProjectFile(root, 'src/my-element.ts', `import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('my-element')
export class MyElement extends LitElement {
  render() {
    return html\`<h1>Hello</h1>\`
  }
}
`)

    applySetup({ root, install: false })

    expect(readProjectFile(root, 'src/vite-env.d.ts')).toContain('@master/css/client')
    expect(readProjectFile(root, 'src/my-element.ts')).toContain('@withMasterCSSRuntime({ manifest, emittedGlobals })')
    expect(readProjectFile(root, 'src/my-element.ts')).toContain('masterCSSRuntime?: MasterCSSRuntime')
  })

  test('plans Angular projects with runtime setup', () => {
    const root = createTempProject('master-css-create-angular-', {
      dependencies: {
        '@angular/core': '^22.0.0'
      }
    })
    writeProjectFile(root, 'angular.json', '{}\n')
    writeProjectFile(root, 'src/main.ts', `import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'

bootstrapApplication(AppComponent)
`)

    const plan = planMasterCSSSetup({ root })

    expect(plan.framework).toBe('angular')
    expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
      '@master/css',
      '@master/css-runtime',
      '@master/css-preset',
      '@master/eslint-config-css',
      'eslint',
      '@master/css-mcp'
    ])

    applySetup({ root, install: false })

    expect(readProjectFile(root, 'src/main.ts')).toContain("import { MasterCSSRuntime } from '@master/css-runtime'")
    expect(readProjectFile(root, 'src/main.ts')).toContain('MasterCSSRuntime.start({ manifest: defaultManifest })')
    expect(readProjectFile(root, 'src/main.ts')).toContain('.then((cssRuntime) => cssRuntime.observe())')
    expect(readProjectFile(root, 'src/styles.css')).toBe("@import '@master/css';\n")
  })

  test('updates existing Next.js config wrappers', () => {
    const root = createTempProject('master-css-create-next-', {
      dependencies: {
        next: '^16.0.0'
      }
    })
    writeProjectFile(root, 'next.config.mjs', `const nextConfig = {
  reactStrictMode: true
}

export default nextConfig;
`)

    applySetup({ root, install: false })

    expect(readProjectFile(root, 'next.config.mjs')).toContain("import withMasterCSS from '@master/css-next'")
    expect(readProjectFile(root, 'next.config.mjs')).toContain('export default withMasterCSS(nextConfig);')
  })

  test('writes async Next.js config for static mode', () => {
    const root = createTempProject('master-css-create-next-static-', {
      dependencies: {
        next: '^16.0.0'
      }
    })

    applySetup({
      root,
      framework: 'nextjs',
      mode: 'static',
      minimal: true,
      install: false
    })

    expect(readProjectFile(root, 'next.config.js')).toContain("const nextConfig = await withMasterCSS({}, { mode: 'static' })")
  })

  test('writes synchronous Next.js config for runtime mode', () => {
    const root = createTempProject('master-css-create-next-runtime-', {
      dependencies: {
        next: '^16.0.0'
      }
    })

    applySetup({
      root,
      framework: 'nextjs',
      mode: 'runtime',
      minimal: true,
      install: false
    })

    const config = readProjectFile(root, 'next.config.js')
    expect(config).toContain("const nextConfig = withMasterCSS({}, { mode: 'runtime' })")
    expect(config).not.toContain('await withMasterCSS')
  })

  test('writes requested modes into supported integration configs', () => {
    const cases = [
      {
        framework: 'vite' as const,
        file: 'vite.config.js',
        expected: "masterCSS({ mode: 'progressive' })"
      },
      {
        framework: 'nuxt' as const,
        file: 'nuxt.config.ts',
        expected: "['@master/css-nuxt', { mode: 'runtime' }]",
        mode: 'runtime' as const
      },
      {
        framework: 'astro' as const,
        file: 'astro.config.mjs',
        expected: "masterCSS({ mode: 'pre-render' })",
        mode: 'pre-render' as const
      },
      {
        framework: 'rspack' as const,
        file: 'rspack.config.mjs',
        expected: "new MasterCSSPlugin({ mode: 'static' })",
        mode: 'static' as const
      },
      {
        framework: 'rsbuild' as const,
        file: 'rsbuild.config.ts',
        expected: "config.plugins.push(new MasterCSSPlugin({ mode: 'runtime' }))",
        mode: 'runtime' as const
      },
      {
        framework: 'webpack' as const,
        file: 'webpack.config.mjs',
        expected: "new MasterCSSPlugin({ mode: 'pre-render' })",
        mode: 'pre-render' as const
      }
    ]

    for (const eachCase of cases) {
      const root = createTempProject(`master-css-create-${eachCase.framework}-mode-`)
      applySetup({
        root,
        framework: eachCase.framework,
        mode: eachCase.mode ?? 'progressive',
        minimal: true,
        install: false
      })

      expect(readProjectFile(root, eachCase.file)).toContain(eachCase.expected)
    }
  })

  test('rejects rendering mode for unsupported setup targets', () => {
    const root = createTempProject('master-css-create-unsupported-mode-')

    for (const framework of ['angular', 'svelte', 'none'] as const) {
      expect(() => planMasterCSSSetup({
        root,
        framework,
        mode: 'static',
        minimal: true
      })).toThrow(`--mode is not supported for ${framework}`)
    }
  })

  test('delegates SvelteKit setup to @master/css-svelte-addon', () => {
    const root = createTempProject('master-css-create-svelte-', {
      dependencies: {
        '@sveltejs/kit': '^2.0.0'
      }
    })

    const plan = planMasterCSSSetup({ root })

    expect(plan.framework).toBe('svelte')
    expect(plan.dependencies.map((dependency) => dependency.name)).toEqual([
      '@master/eslint-config-css',
      'eslint',
      '@master/css-mcp'
    ])
    expect(plan.files.map((file) => file.path)).toEqual([
      'eslint.config.js',
      'AGENTS.md'
    ])
    expect(formatPlannedCommand(plan.commands[0])).toContain('sv add @master/css-svelte-addon')
    expect(formatPlannedCommand(plan.commands[1])).toContain('@master/css-mcp@rc')
  })

  test('does not restore the retired rc.87 @master/css-sv package name', () => {
    const root = createTempProject('master-css-create-rc87-svelte-', {
      dependencies: {
        '@sveltejs/kit': '^2.0.0'
      }
    })

    const plan = planMasterCSSSetup({ root })
    const command = formatPlannedCommand(plan.commands[0])

    expect(plan.framework).toBe('svelte')
    expect(command).toContain('sv add @master/css-svelte-addon')
    expect(command).not.toContain('@master/css-sv ')
  })
})
