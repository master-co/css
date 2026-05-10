import { readdir, readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { createCSS, extendConfig, type Config } from '@master/css'
import { compileStyleCSS, isMasterStyleSource, removeStyleCSSImports } from '@master/css-extractor/style'
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
const DEFAULT_CSS_MODULE_ID = 'master.css'
const DEFAULT_VIRTUAL_CSS_MODULE_ID = 'virtual:master.css'

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

function cleanMasterStyleSource(source: string, moduleIds: Iterable<string>) {
    return removeStyleCSSImports(source, moduleIds).code
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
