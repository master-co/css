import { readdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createCSS, extendConfig, type Config } from '@master/css'
import { compileCSS, type CompileCSSOptions, type CompileCSSResult } from '@master/css-compiler'
import { loadConfig, resolveConfigPath, type ExploreConfigResult } from '@master/css-explore-config'

const STYLE_EXTENSIONS = new Set(['.css', '.scss', '.sass'])
const IGNORED_DIRECTORIES = new Set([
    '.git',
    '.next',
    '.nuxt',
    '.svelte-kit',
    'dist',
    'node_modules',
    'out',
    'public'
])
const CSS_IMPORT_RE = /@import\s+(?:url\(\s*)?(["'])([^"']+)\1\s*\)?[^;]*;/g
const DEFAULT_CSS_MODULE_ID = 'master.css'
const DEFAULT_VIRTUAL_CSS_MODULE_ID = 'virtual:master.css'
const require = createRequire(import.meta.url)

interface SassModule {
    compileStringAsync(source: string, options: {
        url: URL
        style: 'expanded'
        syntax: 'scss' | 'indented'
    }): Promise<{ css: string }>
}

interface MasterStyleSource {
    file: string
    source: string
}

export interface MasterCSSBuildConfig {
    config: Config
    nativeCSS: string
    dependencies: string[]
    styleSources: string[]
}

function getCSSImportIds(moduleIds: Iterable<string>) {
    const ids = new Set(moduleIds)
    for (const id of Array.from(ids)) {
        if (id.startsWith('virtual:')) {
            ids.add(id.slice('virtual:'.length))
        }
    }
    return ids
}

function replaceCSSImports(source: string, moduleIds: Iterable<string>, replacement: string): { code: string, replaced: boolean } {
    let replaced = false
    const ids = getCSSImportIds(moduleIds)
    const code = source.replace(CSS_IMPORT_RE, (rule, _quote: string, id: string) => {
        if (!ids.has(id)) return rule
        replaced = true
        return replacement
    })
    return { code, replaced }
}

function isMasterStyleSource(source: string, moduleIds: Iterable<string>) {
    return source.includes('@master') || replaceCSSImports(source, moduleIds, '').replaced
}

function cleanMasterStyleSource(source: string, moduleIds: Iterable<string>) {
    return replaceCSSImports(source, moduleIds, '').code
}

function loadSass(projectDir: string | undefined): SassModule {
    if (projectDir) {
        try {
            return createRequire(join(projectDir, 'package.json'))('sass') as SassModule
        } catch {
            // Fall through to this package's dependency graph for tests and linked workspaces.
        }
    }
    return require('sass') as SassModule
}

async function preprocessStyleCSS(source: string, file: string, projectDir?: string) {
    const extension = extname(file)
    if (extension !== '.scss' && extension !== '.sass') {
        return source
    }
    const sass = loadSass(projectDir)
    const result = await sass.compileStringAsync(source, {
        url: pathToFileURL(file),
        style: 'expanded',
        syntax: extension === '.sass' ? 'indented' : 'scss'
    })
    return result.css
}

async function compileStyleCSS(
    file: string,
    source: string,
    options: CompileCSSOptions & { projectDir?: string } = {}
): Promise<CompileCSSResult> {
    const { projectDir, ...compileOptions } = options
    const css = await preprocessStyleCSS(source, file, projectDir)
    return compileCSS(css, {
        ...compileOptions,
        from: file
    })
}

async function collectMasterStyleSources(
    projectDir: string,
    excludedFiles: Set<string>,
    moduleIds: Iterable<string>
): Promise<MasterStyleSource[]> {
    const sources: MasterStyleSource[] = []

    async function walk(dir: string) {
        let entries
        try {
            entries = await readdir(dir, { withFileTypes: true })
        } catch {
            return
        }

        await Promise.all(entries.map(async (entry) => {
            const file = join(dir, entry.name)
            if (entry.isDirectory()) {
                if (!IGNORED_DIRECTORIES.has(entry.name)) {
                    await walk(file)
                }
                return
            }
            if (!entry.isFile() || !STYLE_EXTENSIONS.has(extname(entry.name))) return

            const resolvedFile = resolve(file)
            if (excludedFiles.has(resolvedFile)) return

            const source = await readFile(resolvedFile, 'utf-8')
            if (!isMasterStyleSource(source, moduleIds)) return

            sources.push({
                file: resolvedFile,
                source: cleanMasterStyleSource(source, moduleIds)
            })
        }))
    }

    await walk(projectDir)
    return sources.sort((a, b) => a.file.localeCompare(b.file))
}

export async function resolveMasterCSSBuildConfig(
    projectDir: string,
    configOption: string | Config,
    classes?: string[]
): Promise<MasterCSSBuildConfig> {
    let rootConfigResult: ExploreConfigResult | undefined
    if (typeof configOption === 'string') {
        const resolvedConfig = resolveConfigPath({ cwd: projectDir, name: configOption })
        if (resolvedConfig) {
            rootConfigResult = {
                ...resolvedConfig,
                ...await loadConfig(resolvedConfig.path, { classes })
            }
        }
    }
    const rootConfig = typeof configOption === 'string'
        ? rootConfigResult?.config
        : configOption
    const rootDependencies = rootConfigResult?.dependencies || []
    const excludedFiles = new Set(rootDependencies.map((dependency) => resolve(dependency)))
    const moduleIds = [DEFAULT_CSS_MODULE_ID, DEFAULT_VIRTUAL_CSS_MODULE_ID]
    const styleSources = await collectMasterStyleSources(projectDir, excludedFiles, moduleIds)
    const styleResults = await Promise.all(styleSources.map((source) =>
        compileStyleCSS(source.file, source.source, {
            classes,
            projectDir
        })
    ))
    const configs = [
        ...styleResults.map((result) => result.config),
        rootConfig
    ].filter(Boolean) as Config[]
    const config = configs.length ? extendConfig(...configs) : createCSS().config
    const nativeCSS = [
        ...styleResults.map((result) => result.nativeCSS),
        rootConfigResult?.nativeCSS
    ].filter(Boolean).join('\n\n')

    return {
        config,
        nativeCSS,
        dependencies: [
            ...styleSources.map((source) => source.file),
            ...rootDependencies
        ],
        styleSources: styleSources.map((source) => source.file)
    }
}
