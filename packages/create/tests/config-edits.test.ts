import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { planMasterCSSSetup } from '../src'
import {
  ManualSetupStep,
  addLitShadowStylesheet,
  addMasterCSSEslintConfig,
  addMasterCSSNextConfig,
  addMasterCSSNuxtModule,
  addMasterCSSRsbuildPlugin,
  addMasterCSSVitePlugin,
  addMasterCSSWebpackPlugin,
  createNuxtConfig
} from '../src/transforms'

function project(files: Record<string, string>, packageJSON: Record<string, unknown> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'master-css-create-edits-'))
  writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module', ...packageJSON }))
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), content)
  }
  return root
}

const paths = (plan: ReturnType<typeof planMasterCSSSetup>) => plan.files.map(file => [file.path, file.action])

describe('config edits', () => {
  test('registers the Vite plugin in the top-level plugins, not a nested PostCSS list', () => {
    const output = addMasterCSSVitePlugin(`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  css: { postcss: { plugins: [autoprefixer()] } },
  plugins: [react()]
})
`)
    expect(output).toContain('postcss: { plugins: [autoprefixer()] }')
    expect(output).toContain('plugins: [\n            masterCSS(),react()]')
  })

  test('registers the Webpack plugin in the top-level plugins of an exported binding', () => {
    const output = addMasterCSSWebpackPlugin(`const config = {
  resolve: { plugins: [new TsconfigPathsPlugin()] },
  plugins: []
}

export default config
`)
    expect(output).toContain('resolve: { plugins: [new TsconfigPathsPlugin()] }')
    expect(output).toContain('plugins: [\n        new MasterCSSPlugin(),]')
  })

  test('leaves CommonJS configs to the user instead of adding ES imports', () => {
    expect(() => addMasterCSSWebpackPlugin('module.exports = {\n  plugins: [],\n}\n')).toThrow(ManualSetupStep)
    expect(() => addMasterCSSNextConfig('const nextConfig = {}\nmodule.exports = nextConfig\n')).toThrow(ManualSetupStep)
  })

  test('reports configs whose shape setup cannot extend', () => {
    expect(() => addMasterCSSVitePlugin("import { defineConfig } from 'vite'\nexport default defineConfig(() => ({ plugins: [] }))\n")).toThrow(ManualSetupStep)
    expect(() => addMasterCSSEslintConfig("import tseslint from 'typescript-eslint'\nexport default tseslint.config(tseslint.configs.recommended)\n")).toThrow(ManualSetupStep)
    expect(() => addMasterCSSNextConfig('export default function config(phase) {\n  return {}\n}\n')).toThrow(ManualSetupStep)
  })

  test('wraps a multi-line exported Next.js config object', () => {
    expect(addMasterCSSNextConfig('export default {\n  reactStrictMode: true,\n}\n')).toBe(`export default async () => withMasterCSS({
  reactStrictMode: true,
})
import withMasterCSS from '@master/css-next'
`)
  })

  test('keeps an existing defineConfig import and closes the flat array it wraps', () => {
    const output = addMasterCSSEslintConfig(`import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  js.configs.recommended
])
`)
    expect(output.match(/import \{[^}]*defineConfig/g)).toHaveLength(1)
    const wrapped = addMasterCSSEslintConfig(`import js from '@eslint/js'

export default [
  js.configs.recommended
] // see https://eslint.org/docs [flat]
`)
    expect(wrapped).toContain('export default defineConfig([\n  ...masterCSS,\n  js.configs.recommended\n]) // see https://eslint.org/docs [flat]')
  })

  test('keeps an existing Rsbuild rspack hook running after the plugin is registered', () => {
    const output = addMasterCSSRsbuildPlugin(`import { defineConfig } from '@rsbuild/core'

export default defineConfig({
  tools: {
    rspack: (config, { appendPlugins }) => {
      config.resolve.alias.foo = './foo'
      return config
    }
  }
})
`)
    expect(output.match(/\brspack\b/g)).toHaveLength(1)
    expect(output.indexOf('config.plugins.push(new MasterCSSPlugin())')).toBeLessThan(output.indexOf("config.resolve.alias.foo = './foo'"))
    expect(output.match(/return config/g)).toHaveLength(1)
  })

  test('lists the Nuxt stylesheet entry from the project root', () => {
    const output = addMasterCSSNuxtModule("export default defineNuxtConfig({\n  compatibilityDate: '2025-07-15'\n})\n")
    expect(output).toContain("css: ['~~/assets/css/master.css']")
    expect(output).toContain("modules: ['@master/css-nuxt']")
    expect(createNuxtConfig()).toContain("css: ['~~/assets/css/master.css']")
  })

  test('keeps the override modifier on the Lit styles getter', () => {
    const output = addLitShadowStylesheet(`import { LitElement, css } from 'lit'

export class MyElement extends LitElement {
  static override styles = css\`:host { display: block }\`
}
`)
    expect(output).toContain('static masterCSSOriginalStyles = css`')
    expect(output).toContain('static override get styles() { return [unsafeCSS(masterCSSStyles), this.masterCSSOriginalStyles] }')
  })
})

describe('planned files', () => {
  test('updates the Next.js stylesheet of a src/ App Router project', () => {
    const root = project({ 'src/app/layout.tsx': 'export default function Layout() {}', 'src/app/globals.css': 'body{}' }, { dependencies: { next: '^16.0.0' } })
    expect(paths(planMasterCSSSetup({ root, eslint: false, mcp: false, ai: false }))).toEqual([['next.config.js', 'create'], ['src/app/globals.css', 'update']])
  })

  test('edits the Vite config Vite loads instead of shadowing it', () => {
    const root = project({ 'vite.config.mts': "import { defineConfig } from 'vite'\nexport default defineConfig({ plugins: [vue()] })\n", 'src/main.css': '' }, { dependencies: { vue: '^3.5.0', vite: '^8.0.0' } })
    expect(paths(planMasterCSSSetup({ root, eslint: false, mcp: false, ai: false }))[0]).toEqual(['vite.config.mts', 'update'])
  })

  test('skips configs it cannot edit and says what to add', () => {
    const root = project({ 'webpack.config.cjs': 'module.exports = {\n  plugins: [],\n}\n' }, { devDependencies: { webpack: '^5.0.0' } })
    const plan = planMasterCSSSetup({ root, framework: 'webpack', eslint: false, mcp: false, ai: false })
    expect(paths(plan)[0]).toEqual(['webpack.config.cjs', 'skip'])
    expect(plan.warnings.some(warning => warning.startsWith('webpack.config.cjs: This CommonJS config cannot take an ES import'))).toBe(true)
  })

  test('updates an Angular Sass global stylesheet', () => {
    const root = project({ 'src/styles.scss': '' }, { dependencies: { '@angular/core': '^21.0.0' } })
    expect(paths(planMasterCSSSetup({ root, framework: 'angular', eslint: false, mcp: false, ai: false }))).toContainEqual(['src/styles.scss', 'update'])
  })
})
