import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { AGENT_RULES_BLOCK, CANONICAL_ESLINT_CONFIG, MASTER_CSS_PACKAGES, MASTER_CSS_VERSION } from './constants'
import { resolveRenderingMode, type RenderingMode } from './modes'
import {
    addAngularRuntimeSetup,
    addMasterCSSAstroIntegration,
    addMasterCSSEslintConfig,
    addMasterCSSImportToStylesheet,
    addMasterCSSNextConfig,
    addMasterCSSNuxtModule,
    addMasterCSSRsbuildPlugin,
    addMasterCSSRspackPlugin,
    addMasterCSSStaticVitePlugin,
    addMasterCSSTanStackStartVitePlugin,
    addMasterCSSVitePlugin,
    addReactRouterRootCSSImport,
    addTanStackStartRootCSSImport,
    addLitShadowRuntime,
    addViteClientTypes,
    createAstroConfig,
    createMasterCSSStylesheet,
    createNextConfig,
    createNuxtConfig,
    createRsbuildConfig,
    createRspackConfig,
    createStaticViteConfig,
    createViteConfig
} from './transforms'

export type Framework = 'none' | 'vite' | 'react' | 'react-router' | 'tanstack-start' | 'vue' | 'nextjs' | 'svelte' | 'nuxt' | 'astro' | 'webpack' | 'rspack' | 'rsbuild' | 'laravel' | 'lit' | 'angular'
export type FrameworkOption = Framework | 'auto'
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'
export type FileAction = 'create' | 'update' | 'skip'
export type { RenderingMode }

export interface SetupOptions {
    root?: string
    framework?: FrameworkOption
    eslint?: boolean
    mcp?: boolean
    ai?: boolean
    minimal?: boolean
    install?: PackageManager | false
    yes?: boolean
    packageTag?: string
    mode?: RenderingMode
}

export interface PlannedDependency {
    name: string
    version: string
    dev: boolean
}

export interface PlannedFileChange {
    path: string
    action: FileAction
    content?: string
    reason: string
}

export interface PlannedCommand {
    command: string
    reason: string
}

export interface SetupPlan {
    version: 1
    root: string
    framework: Framework
    packageManager: PackageManager
    dependencies: PlannedDependency[]
    files: PlannedFileChange[]
    commands: PlannedCommand[]
    warnings: string[]
    mode?: RenderingMode
    summary: {
        dependencies: number
        filesToCreate: number
        filesToUpdate: number
        commands: number
        warnings: number
    }
}

interface PackageJSON {
    packageManager?: string
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    scripts?: Record<string, string>
}

const lockfiles: Record<PackageManager, string> = {
    pnpm: 'pnpm-lock.yaml',
    npm: 'package-lock.json',
    yarn: 'yarn.lock',
    bun: 'bun.lockb'
}

export function createSetupPlan(options: SetupOptions = {}): SetupPlan {
    const root = resolve(options.root || process.cwd())
    const packageJSON = readPackageJSON(root)
    const packageManager = resolvePackageManager(root, packageJSON, options.install || undefined)
    const framework = resolveFramework(root, packageJSON, options.framework || 'auto')
    const mode = resolveRenderingMode(options.mode)
    assertFrameworkSupportsMode(framework, mode)
    const version = options.packageTag || MASTER_CSS_VERSION
    const eslint = resolveRecommendedOption(options.eslint, options.minimal)
    const mcp = resolveRecommendedOption(options.mcp, options.minimal)
    const ai = resolveRecommendedOption(options.ai, options.minimal)
    const dependencies: PlannedDependency[] = []
    const files: PlannedFileChange[] = []
    const commands: PlannedCommand[] = []
    const warnings: string[] = []

    if (framework === 'svelte') {
        commands.push({
            command: packageManager === 'pnpm'
                ? 'pnpm dlx sv add @master/css-sv'
                : packageManager === 'yarn'
                    ? 'yarn dlx sv add @master/css-sv'
                    : packageManager === 'bun'
                        ? 'bunx sv add @master/css-sv'
                        : 'npx sv add @master/css-sv',
            reason: 'SvelteKit file setup is delegated to the official Svelte CLI add-on.'
        })
    } else {
        for (const dependency of dependenciesForFramework(framework, version)) {
            pushDependency(dependencies, dependency.name, dependency.dev, dependency.version)
        }
        files.push(...filesForFramework(root, framework, warnings, mode))
    }

    if (eslint) {
        pushDependency(dependencies, MASTER_CSS_PACKAGES.eslintConfig, true, version)
        pushDependency(dependencies, 'eslint', true, '^9.0.0 || ^10.0.0')
        files.push(planTextFile(root, 'eslint.config.js', addMasterCSSEslintConfig, CANONICAL_ESLINT_CONFIG, 'Add the Master CSS recommended ESLint flat config.'))
    }

    if (mcp) {
        pushDependency(dependencies, MASTER_CSS_PACKAGES.mcp, true, version)
        commands.push({
            command: `npx -y @master/css-mcp@${version} --root ${root}`,
            reason: 'Use this stdio command when registering the Master CSS MCP server in an MCP client.'
        })
    }

    if (ai) {
        files.push(planTextFile(root, 'AGENTS.md', appendAgentRules, AGENT_RULES_BLOCK, 'Add Master CSS instructions for local coding agents.'))
    }

    if (!existsSync(join(root, 'package.json'))) {
        warnings.push('No package.json was found. Dependency changes will be skipped until a package.json exists.')
    }

    if (framework === 'none') {
        warnings.push('No supported framework was detected. The plan adds base Master CSS packages and a standalone stylesheet entry only.')
    }

    return {
        version: 1,
        root,
        framework,
        packageManager,
        dependencies,
        files,
        commands,
        warnings,
        ...(mode ? { mode } : {}),
        summary: {
            dependencies: dependencies.length,
            filesToCreate: files.filter((file) => file.action === 'create').length,
            filesToUpdate: files.filter((file) => file.action === 'update').length,
            commands: commands.length,
            warnings: warnings.length
        }
    }
}

export function applySetupPlan(plan: SetupPlan, options: SetupOptions = {}) {
    applyDependencyChanges(plan.root, plan.dependencies)
    for (const file of plan.files) {
        if (file.action === 'skip' || file.content === undefined) continue
        const filePath = join(plan.root, file.path)
        mkdirSync(dirname(filePath), { recursive: true })
        writeFileSync(filePath, file.content, 'utf8')
    }

    const install = options.install === false ? false : options.install || (options.yes ? plan.packageManager : undefined)
    if (install) {
        const result = spawnSync(install, ['install'], {
            cwd: plan.root,
            stdio: 'inherit',
            shell: process.platform === 'win32'
        })
        if (result.status) {
            throw new Error(`${install} install failed with exit code ${result.status}`)
        }
    }
}

export function applySetup(options: SetupOptions = {}) {
    const plan = createSetupPlan(options)
    applySetupPlan(plan, options)
    return plan
}

function filesForFramework(root: string, framework: Framework, warnings: string[], mode?: RenderingMode): PlannedFileChange[] {
    switch (framework) {
        case 'vite':
            return [
                planTextFile(root, firstExistingPath(root, ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'], 'vite.config.js'), (content) => addMasterCSSVitePlugin(content, mode), createViteConfig(mode), 'Register the Master CSS Vite plugin.'),
                planTextFile(root, firstExistingPath(root, ['src/style.css', 'src/index.css', 'src/main.css'], 'src/style.css'), addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create or update the project CSS entry.')
            ]
        case 'react':
            return [
                planTextFile(root, firstExistingPath(root, ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'], 'vite.config.js'), (content) => addMasterCSSVitePlugin(content, mode), createViteConfig(mode), 'Register the Master CSS Vite plugin.'),
                planTextFile(root, firstExistingPath(root, ['src/index.css', 'src/style.css'], 'src/index.css'), addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create or update the React project CSS entry.')
            ]
        case 'react-router': {
            const files: PlannedFileChange[] = [
                planTextFile(root, firstExistingPath(root, ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'], 'vite.config.ts'), (content) => addMasterCSSVitePlugin(content, mode), createViteConfig(mode), 'Register the Master CSS Vite plugin.'),
                planTextFile(root, 'app/app.css', addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create or update the React Router app stylesheet entry.')
            ]
            const rootEntryPath = findExistingPath(root, ['app/root.tsx', 'app/root.jsx', 'app/root.ts', 'app/root.js'])
            if (rootEntryPath) {
                files.push(planTextFile(root, rootEntryPath, addReactRouterRootCSSImport, '', 'Import the React Router app stylesheet from the root route.'))
            } else {
                warnings.push('No app/root.tsx, app/root.jsx, app/root.ts, or app/root.js file was found. Import ./app.css from the React Router root route manually after setup.')
            }
            return files
        }
        case 'tanstack-start': {
            const pluginMode = mode ?? 'static'
            const files: PlannedFileChange[] = [
                planTextFile(root, firstExistingPath(root, ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'], 'vite.config.ts'), (content) => addMasterCSSTanStackStartVitePlugin(content, pluginMode), createViteConfig(pluginMode), `Register the Master CSS Vite plugin in ${pluginMode} mode.`),
                planTextFile(root, 'src/styles/app.css', addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create or update the TanStack Start stylesheet entry.')
            ]
            const rootEntryPath = findExistingPath(root, ['src/routes/__root.tsx', 'src/routes/__root.jsx', 'src/routes/__root.ts', 'src/routes/__root.js'])
            if (rootEntryPath) {
                files.push(planTextFile(root, rootEntryPath, addTanStackStartRootCSSImport, '', 'Import the TanStack Start stylesheet from the root route.'))
            } else {
                warnings.push('No src/routes/__root.tsx, src/routes/__root.jsx, src/routes/__root.ts, or src/routes/__root.js file was found. Import ../styles/app.css from the TanStack Start root route manually after setup.')
            }
            return files
        }
        case 'vue':
            return [
                planTextFile(root, firstExistingPath(root, ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'], 'vite.config.ts'), (content) => addMasterCSSVitePlugin(content, mode), createViteConfig(mode), 'Register the Master CSS Vite plugin.'),
                planTextFile(root, firstExistingPath(root, ['src/assets/main.css', 'src/style.css', 'src/main.css'], 'src/assets/main.css'), addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create or update the Vue project CSS entry.')
            ]
        case 'nextjs':
            return [
                planTextFile(root, firstExistingPath(root, ['next.config.ts', 'next.config.mjs', 'next.config.js'], 'next.config.js'), (content) => addMasterCSSNextConfig(content, mode), createNextConfig(mode), 'Register the Master CSS Next.js adapter.'),
                planTextFile(root, 'app/globals.css', addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create or update the Next.js global stylesheet entry.')
            ]
        case 'nuxt':
            return [
                planTextFile(root, firstExistingPath(root, ['nuxt.config.ts', 'nuxt.config.js'], 'nuxt.config.ts'), (content) => addMasterCSSNuxtModule(content, mode), createNuxtConfig(mode), 'Register the Master CSS Nuxt module.'),
                planTextFile(root, 'assets/css/master.css', addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create the Nuxt CSS entry referenced by nuxt.config.')
            ]
        case 'astro':
            return [
                planTextFile(root, firstExistingPath(root, ['astro.config.mjs', 'astro.config.js', 'astro.config.ts'], 'astro.config.mjs'), (content) => addMasterCSSAstroIntegration(content, mode), createAstroConfig(mode), 'Register the Master CSS Astro integration.'),
                planTextFile(root, 'src/styles/global.css', addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create the Astro project CSS entry.')
            ]
        case 'laravel': {
            const viteConfigPath = findExistingPath(root, ['vite.config.ts', 'vite.config.js'])
            const files: PlannedFileChange[] = [
                planTextFile(root, 'resources/css/app.css', addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create or update the Laravel Vite CSS entry.')
            ]
            if (viteConfigPath) {
                files.unshift(planTextFile(root, viteConfigPath, addMasterCSSStaticVitePlugin, createStaticViteConfig(), 'Register the Master CSS Vite plugin in static mode.'))
            } else {
                warnings.push('No vite.config.ts or vite.config.js was found. Add @master/css.vite to the Laravel Vite config manually after setup.')
            }
            return files
        }
        case 'lit': {
            const files = [
                planTextFile(root, firstExistingPath(root, ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'], 'vite.config.ts'), (content) => addMasterCSSVitePlugin(content, mode), createViteConfig(mode), 'Register the Master CSS Vite plugin.'),
                planTextFile(root, 'src/index.css', addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create or update the Lit project CSS entry.'),
                planTextFile(root, 'src/vite-env.d.ts', addViteClientTypes, `/// <reference types="vite/client" />
/// <reference types="@master/css-integration/client" />
`, 'Add Vite and Master CSS integration client types.')
            ]
            const elementPath = findExistingPath(root, ['src/my-element.ts', 'src/my-element.js'])
            if (elementPath) {
                files.push(planTextFile(root, elementPath, addLitShadowRuntime, '', 'Initialize Master CSS Runtime for the Lit shadow root.'))
            } else {
                warnings.push('No standard src/my-element.ts or src/my-element.js file was found. Add @cssRuntime to Lit elements that render Master CSS classes inside shadow roots.')
            }
            return files
        }
        case 'angular': {
            const files = [
                planTextFile(root, 'src/styles.css', addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create or update the Angular global stylesheet entry.')
            ]
            const mainPath = findExistingPath(root, ['src/main.ts'])
            if (mainPath) {
                files.unshift(planTextFile(root, mainPath, addAngularRuntimeSetup, '', 'Initialize Master CSS Runtime in the Angular browser entry.'))
            } else {
                warnings.push('No src/main.ts file was found. Initialize CSSRuntime manually in the Angular browser entry after setup.')
            }
            return files
        }
        case 'rspack':
            return [
                planTextFile(root, firstExistingPath(root, ['rspack.config.ts', 'rspack.config.mts', 'rspack.config.mjs', 'rspack.config.js', 'rspack.config.cjs'], 'rspack.config.mjs'), (content) => addMasterCSSRspackPlugin(content, mode), createRspackConfig(mode), 'Register the Master CSS Webpack-compatible plugin in the Rspack config.'),
                planTextFile(root, 'src/index.css', addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create or update the project CSS entry for Rspack.')
            ]
        case 'rsbuild':
            return [
                planTextFile(root, firstExistingPath(root, ['rsbuild.config.ts', 'rsbuild.config.mts', 'rsbuild.config.mjs', 'rsbuild.config.js'], 'rsbuild.config.ts'), (content) => addMasterCSSRsbuildPlugin(content, mode), createRsbuildConfig(mode), 'Register the Master CSS Webpack-compatible plugin through Rsbuild tools.rspack.'),
                planTextFile(root, 'src/index.css', addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create or update the project CSS entry for Rsbuild.')
            ]
        case 'webpack':
            return [
                planTextFile(root, 'src/index.css', addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create or update the project CSS entry for Webpack.')
            ]
        case 'none':
        default:
            return [
                planTextFile(root, 'src/master.css', addMasterCSSImportToStylesheet, createMasterCSSStylesheet(), 'Create a standalone Master CSS stylesheet entry.')
            ]
    }
}

function assertFrameworkSupportsMode(framework: Framework, mode: RenderingMode | undefined) {
    if (!mode) return
    if (framework === 'laravel') {
        if (mode === 'static') return
        throw new Error(`--mode ${mode} is not supported for laravel. The Laravel installer only supports --mode static.`)
    }
    if (framework === 'angular' || framework === 'svelte' || framework === 'webpack' || framework === 'none') {
        throw new Error(`--mode is not supported for ${framework}. Supported frameworks: vite, react, react-router, tanstack-start, vue, nextjs, nuxt, astro, rspack, rsbuild, laravel, lit.`)
    }
}

function dependenciesForFramework(framework: Framework, version: string): PlannedDependency[] {
    const dependencies = [{ name: MASTER_CSS_PACKAGES.css, version, dev: false }]
    if (framework === 'vite' || framework === 'react' || framework === 'react-router' || framework === 'tanstack-start' || framework === 'vue' || framework === 'laravel' || framework === 'lit') dependencies.push({ name: MASTER_CSS_PACKAGES.vite, version, dev: false })
    if (framework === 'nextjs') dependencies.push({ name: MASTER_CSS_PACKAGES.next, version, dev: false })
    if (framework === 'nuxt') dependencies.push({ name: MASTER_CSS_PACKAGES.nuxt, version, dev: false })
    if (framework === 'astro') dependencies.push({ name: MASTER_CSS_PACKAGES.astro, version, dev: false })
    if (framework === 'webpack' || framework === 'rspack' || framework === 'rsbuild') dependencies.push({ name: MASTER_CSS_PACKAGES.webpack, version, dev: false })
    if (framework === 'none' || framework === 'lit' || framework === 'angular') dependencies.push({ name: MASTER_CSS_PACKAGES.runtime, version, dev: false })
    if (framework === 'angular') dependencies.push({ name: MASTER_CSS_PACKAGES.preset, version, dev: false })
    return dependencies
}

function planTextFile(
    root: string,
    path: string,
    transform: (content: string) => string,
    createContent: string,
    reason: string
): PlannedFileChange {
    const filePath = join(root, path)
    if (!existsSync(filePath)) {
        return {
            path,
            action: 'create',
            content: createContent,
            reason
        }
    }
    const content = readFileSync(filePath, 'utf8')
    const nextContent = transform(content)
    return {
        path,
        action: nextContent === content ? 'skip' : 'update',
        ...(nextContent === content ? {} : { content: nextContent }),
        reason
    }
}

function applyDependencyChanges(root: string, dependencies: PlannedDependency[]) {
    if (!dependencies.length) return
    const packageJSONPath = join(root, 'package.json')
    if (!existsSync(packageJSONPath)) return
    const packageJSON = JSON.parse(readFileSync(packageJSONPath, 'utf8')) as PackageJSON
    packageJSON.dependencies ||= {}
    packageJSON.devDependencies ||= {}

    for (const dependency of dependencies) {
        const target = dependency.dev ? packageJSON.devDependencies : packageJSON.dependencies
        const other = dependency.dev ? packageJSON.dependencies : packageJSON.devDependencies
        if (other?.[dependency.name]) continue
        if (!target?.[dependency.name]) {
            target![dependency.name] = dependency.version
        }
    }

    writeFileSync(packageJSONPath, `${JSON.stringify(packageJSON, null, 4)}\n`, 'utf8')
}

function pushDependency(dependencies: PlannedDependency[], name: string, dev: boolean, version: string) {
    if (dependencies.some((dependency) => dependency.name === name)) return
    dependencies.push({ name, dev, version })
}

function firstExistingPath(root: string, paths: string[], fallback: string): string {
    return findExistingPath(root, paths) || fallback
}

function findExistingPath(root: string, paths: string[]): string | undefined {
    return paths.find((path) => existsSync(join(root, path)))
}

function readPackageJSON(root: string): PackageJSON | undefined {
    try {
        return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as PackageJSON
    } catch {
        return
    }
}

function resolvePackageManager(root: string, packageJSON: PackageJSON | undefined, explicit?: string): PackageManager {
    if (isPackageManager(explicit)) return explicit
    const declared = packageJSON?.packageManager?.split('@')[0]
    if (isPackageManager(declared)) return declared
    for (const [name, lockfile] of Object.entries(lockfiles) as [PackageManager, string][]) {
        if (existsSync(join(root, lockfile))) return name
    }
    return 'npm'
}

function resolveFramework(root: string, packageJSON: PackageJSON | undefined, framework: FrameworkOption): Framework {
    if (framework !== 'auto') return framework
    const dependencies = {
        ...packageJSON?.dependencies,
        ...packageJSON?.devDependencies
    }
    if (existsSync(join(root, 'next.config.js')) || existsSync(join(root, 'next.config.mjs')) || existsSync(join(root, 'next.config.ts')) || dependencies.next) return 'nextjs'
    if (existsSync(join(root, 'svelte.config.js')) || existsSync(join(root, 'svelte.config.mjs')) || dependencies['@sveltejs/kit']) return 'svelte'
    if (existsSync(join(root, 'nuxt.config.ts')) || existsSync(join(root, 'nuxt.config.js')) || dependencies.nuxt) return 'nuxt'
    if (existsSync(join(root, 'astro.config.mjs')) || existsSync(join(root, 'astro.config.js')) || dependencies.astro) return 'astro'
    if (existsSync(join(root, 'angular.json')) || dependencies['@angular/core']) return 'angular'
    if (dependencies['laravel-vite-plugin'] || existsSync(join(root, 'artisan'))) return 'laravel'
    if (existsSync(join(root, 'rsbuild.config.ts')) || existsSync(join(root, 'rsbuild.config.mts')) || existsSync(join(root, 'rsbuild.config.mjs')) || existsSync(join(root, 'rsbuild.config.js')) || dependencies['@rsbuild/core']) return 'rsbuild'
    if (existsSync(join(root, 'rspack.config.ts')) || existsSync(join(root, 'rspack.config.mts')) || existsSync(join(root, 'rspack.config.mjs')) || existsSync(join(root, 'rspack.config.js')) || existsSync(join(root, 'rspack.config.cjs')) || dependencies['@rspack/core'] || dependencies['@rspack/cli']) return 'rspack'
    if (existsSync(join(root, 'react-router.config.ts')) || existsSync(join(root, 'react-router.config.js')) || existsSync(join(root, 'react-router.config.mjs')) || existsSync(join(root, 'react-router.config.mts')) || dependencies['@react-router/dev']) return 'react-router'
    if (dependencies['@tanstack/react-start']) return 'tanstack-start'
    if (dependencies.vue || dependencies['@vitejs/plugin-vue'] || existsSync(join(root, 'src/App.vue'))) return 'vue'
    if (dependencies.lit) return 'lit'
    if (dependencies.react || dependencies['react-dom']) return 'react'
    if (existsSync(join(root, 'webpack.config.js')) || existsSync(join(root, 'webpack.config.mjs')) || dependencies.webpack) return 'webpack'
    if (existsSync(join(root, 'vite.config.ts')) || existsSync(join(root, 'vite.config.js')) || dependencies.vite) return 'vite'
    return 'none'
}

function isPackageManager(value: unknown): value is PackageManager {
    return value === 'npm' || value === 'pnpm' || value === 'yarn' || value === 'bun'
}

function resolveRecommendedOption(value: boolean | undefined, minimal: boolean | undefined) {
    if (value !== undefined) return value
    return !minimal
}

function appendAgentRules(content: string) {
    if (content.includes('## Master CSS')) return content
    return `${content.trimEnd()}${content.trim() ? '\n\n' : ''}${AGENT_RULES_BLOCK}`
}
