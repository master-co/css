import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, sep } from 'node:path'
import { promisify } from 'node:util'
import { gzip } from 'node:zlib'
import { pathToFileURL } from 'node:url'

type BuildOptions = any
type OpenNextConfig = any
type ProjectOptions = any
type WranglerConfig = any

const gzipAsync = promisify(gzip)
const localRequire = createRequire(import.meta.url)
// OpenNext Cloudflare does not expose a public hook between createServerBundle and bundleServer.
// Resolve its real package root so this site-local wrapper can mirror the CLI build flow in one place.
const cloudflareEntryPath = realpathSync(localRequire.resolve('@opennextjs/cloudflare'))
const cloudflarePackageRoot = dirname(dirname(dirname(cloudflareEntryPath)))
const cloudflareRequire = createRequire(join(cloudflarePackageRoot, 'package.json'))
const forbiddenWorkerInputs = [
    'shiki/dist/index.mjs',
    'langs-bundle-full',
    '@shikijs/langs/dist/emacs-lisp.mjs'
]

export async function buildOpenNextCloudflareWorker(siteDir: string) {
    const previousCwd = process.cwd()
    process.chdir(siteDir)

    try {
        const {
            compileConfig,
            getNormalizedOptions,
            printHeaders,
            readWranglerConfig
        } = await importCloudflareCliModule<{
            compileConfig(configPath?: string): Promise<{ config: OpenNextConfig, buildDir: string }>
            getNormalizedOptions(config: OpenNextConfig, buildDir?: string): BuildOptions
            printHeaders(command: string): void
            readWranglerConfig(args: Record<string, unknown>): Promise<WranglerConfig>
        }>('dist/cli/commands/utils/utils.js')

        const args = {
            skipNextBuild: false,
            noMinify: false,
            skipWranglerConfigCheck: true,
            openNextConfigPath: undefined,
            dangerouslyUseUnsupportedNextVersion: false,
            config: undefined,
            configPath: undefined,
            env: undefined,
            wranglerConfigPath: undefined,
            wranglerArgs: [] as string[],
            args: [] as string[]
        }

        printHeaders('build')
        const { config, buildDir } = await compileConfig(args.openNextConfigPath)
        const options = getNormalizedOptions(config, buildDir)
        const projectOpts = { ...args, minify: !args.noMinify, sourceDir: process.cwd() }
        const wranglerConfig = await readWranglerConfig(args)

        await buildWithShikiPruning(
            options,
            config,
            projectOpts,
            wranglerConfig,
            args.dangerouslyUseUnsupportedNextVersion
        )
    } finally {
        process.chdir(previousCwd)
    }
}

async function buildWithShikiPruning(
    options: BuildOptions,
    config: OpenNextConfig,
    projectOpts: ProjectOptions,
    wranglerConfig: WranglerConfig,
    allowUnsupportedNextVersions: boolean
) {
    const { buildNextjsApp, setStandaloneBuildMode } = await importAwsModule<any>('@opennextjs/aws/build/buildNextApp.js')
    const { compileCache } = await importAwsModule<any>('@opennextjs/aws/build/compileCache.js')
    const { createCacheAssets, createStaticAssets } = await importAwsModule<any>('@opennextjs/aws/build/createAssets.js')
    const { createMiddleware } = await importAwsModule<any>('@opennextjs/aws/build/createMiddleware.js')
    const buildHelper = await importAwsModule<any>('@opennextjs/aws/build/helper.js')
    const { patchOriginalNextConfig } = await importAwsModule<any>('@opennextjs/aws/build/patch/patches/index.js')
    const { printHeader } = await importAwsModule<any>('@opennextjs/aws/build/utils.js')
    const logger = (await importAwsModule<any>('@opennextjs/aws/logger.js')).default
    const { ensureNextjsVersionSupported } = await importCloudflareCliModule<any>('dist/cli/utils/nextjs-support.js')
    const { bundleServer } = await importCloudflareCliModule<any>('dist/cli/build/bundle-server.js')
    const { compileCacheAssetsManifestSqlFile } = await importCloudflareCliModule<any>('dist/cli/build/open-next/compile-cache-assets-manifest.js')
    const { compileEnvFiles } = await importCloudflareCliModule<any>('dist/cli/build/open-next/compile-env-files.js')
    const { compileImages } = await importCloudflareCliModule<any>('dist/cli/build/open-next/compile-images.js')
    const { compileInit } = await importCloudflareCliModule<any>('dist/cli/build/open-next/compile-init.js')
    const { compileSkewProtection } = await importCloudflareCliModule<any>('dist/cli/build/open-next/compile-skew-protection.js')
    const { compileDurableObjects } = await importCloudflareCliModule<any>('dist/cli/build/open-next/compileDurableObjects.js')
    const { createServerBundle } = await importCloudflareCliModule<any>('dist/cli/build/open-next/createServerBundle.js')
    const { useNodeMiddleware: hasNodeMiddleware } = await importCloudflareCliModule<any>('dist/cli/build/utils/middleware.js')
    const { getVersion } = await importCloudflareCliModule<any>('dist/cli/build/utils/version.js')

    options.minify = false

    buildHelper.checkRunningInsideNextjsApp(options)
    logger.info(`App directory: ${options.appPath}`)
    buildHelper.printNextjsVersion(options)
    await ensureNextjsVersionSupported(options)
    buildHelper.checkNextVersionSupport(
        options.nextVersion,
        allowUnsupportedNextVersions,
        '--dangerouslyUseUnsupportedNextVersion'
    )

    const { aws, cloudflare } = getVersion()
    logger.info(`@opennextjs/cloudflare version: ${cloudflare}`)
    logger.info(`@opennextjs/aws version: ${aws}`)

    if (wranglerConfig.compatibility_date) {
        const sixMonthsAgoMs = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000
        const compatDateMs = new Date(wranglerConfig.compatibility_date).getTime()
        if (!Number.isNaN(compatDateMs)) {
            const dateMessage = `workerd compatibility_date: ${wranglerConfig.compatibility_date}`
            if (compatDateMs < sixMonthsAgoMs) {
                logger.warn(`${dateMessage}, consider updating your wrangler config to a more recent date to benefit from the latest features and fixes.`)
            } else {
                logger.info(dateMessage)
            }
        }
    }

    buildHelper.initOutputDir(options)
    if (projectOpts.skipNextBuild) {
        logger.warn('Skipping Next.js build')
    } else {
        printHeader('Building Next.js app')
        setStandaloneBuildMode(options)
        buildNextjsApp(options)
    }

    if (hasNodeMiddleware(options)) {
        logger.error('Node.js middleware is not currently supported. Consider switching to Edge Middleware.')
        process.exit(1)
    }

    printHeader('Generating bundle')
    await patchOriginalNextConfig(options)
    compileCache(options)
    compileEnvFiles(options)
    await compileInit(options, wranglerConfig)
    await compileImages(options)
    await compileSkewProtection(options, config)
    await createMiddleware(options, { forceOnlyBuildOnce: true })
    createStaticAssets(options, { useBasePath: true })

    if (config.dangerous?.disableIncrementalCache !== true) {
        const { useTagCache, metaFiles } = createCacheAssets(options)
        if (useTagCache) {
            compileCacheAssetsManifestSqlFile(options, metaFiles)
        }
    }

    await createServerBundle(options)

    const packagePath = buildHelper.getPackagePath(options)
    const serverFunctionDir = join(options.outputDir, 'server-functions', 'default', packagePath)
    const pruneResult = await pruneUnusedShikiTurbopackExternalImports(serverFunctionDir)
    if (pruneResult.prunedCases > 0) {
        logger.info(`Pruned ${pruneResult.prunedCases} unused Shiki Turbopack external import case(s).`)
    }

    await compileDurableObjects(options)
    await bundleServer(options, projectOpts)
    await assertOptimizedWorkerBundle(serverFunctionDir, options.appPath)

    logger.info('OpenNext build complete.')
}

async function pruneUnusedShikiTurbopackExternalImports(serverFunctionDir: string) {
    const chunksDir = join(serverFunctionDir, '.next/server/chunks')
    const chunkFiles = await listFiles(chunksDir)
    const runtimeFiles = chunkFiles.filter((file) => file.endsWith(`${sep}[turbopack]_runtime.js`))
    const usageFiles = chunkFiles.filter((file) => file.endsWith('.js') && !runtimeFiles.includes(file))
    let prunedCases = 0

    for (const runtimeFile of runtimeFiles) {
        const code = await readFile(runtimeFile, 'utf8')
        const shikiCases = findBareShikiExternalCases(code)
        if (!shikiCases.length) continue

        const externalImportAlias = getExternalImportAlias(code)
        if (!externalImportAlias) {
            throw new Error(`Cannot safely prune Shiki external imports because ${runtimeFile} does not expose the Turbopack externalImport alias.`)
        }

        let nextCode = code
        for (const shikiCase of shikiCases) {
            const isUsed = await hasExternalImportUsage(usageFiles, externalImportAlias, shikiCase.id)
            if (isUsed) {
                throw new Error(`Cannot prune Shiki external import "${shikiCase.id}" because it is still referenced by server chunks.`)
            }

            nextCode = nextCode.replace(shikiCase.block, '')
            prunedCases += 1
        }

        if (nextCode !== code) {
            await writeFile(runtimeFile, nextCode, 'utf8')
        }
    }

    return { runtimeFiles: runtimeFiles.length, prunedCases }
}

function findBareShikiExternalCases(code: string) {
    const cases: { id: string, block: string }[] = []
    const casePattern = /(?<block>^[ \t]*case "(?<id>shiki-[^"\/]+)":\r?\n[ \t]*[\w$]+\s*=\s*await import\("(?<importPath>[^"]+)"\);\r?\n[ \t]*break;\r?\n?)/gm

    for (const match of code.matchAll(casePattern)) {
        const { block, id, importPath } = match.groups ?? {}
        if (block && id && importPath && isBareShikiImportPath(importPath)) {
            cases.push({ id, block })
        }
    }

    return cases
}

function isBareShikiImportPath(importPath: string) {
    return importPath === 'shiki' || /(?:^|\/)node_modules\/shiki$/.test(importPath)
}

function getExternalImportAlias(code: string) {
    return code.match(/contextPrototype\.(\w+)\s*=\s*externalImport/)?.[1]
}

async function hasExternalImportUsage(files: string[], externalImportAlias: string, externalId: string) {
    const usagePattern = new RegExp(`\\.${escapeRegExp(externalImportAlias)}\\(\\s*["'\`]${escapeRegExp(externalId)}["'\`]\\s*\\)`)

    for (const file of files) {
        const code = await readFile(file, 'utf8')
        if (usagePattern.test(code)) return true
    }

    return false
}

async function assertOptimizedWorkerBundle(serverFunctionDir: string, appPath: string) {
    const handlerPath = join(serverFunctionDir, 'handler.mjs')
    const metafilePath = `${handlerPath}.meta.json`
    const [handlerCode, metafileText] = await Promise.all([
        readFile(handlerPath),
        readFile(metafilePath, 'utf8')
    ])
    const metafile = JSON.parse(metafileText) as { inputs?: Record<string, unknown> }
    const inputs = Object.keys(metafile.inputs ?? {})
    const forbiddenMatches = inputs.filter((input) => forbiddenWorkerInputs.some((pattern) => input.includes(pattern)))

    if (forbiddenMatches.length) {
        throw new Error([
            'Cloudflare Worker bundle still includes full Shiki inputs:',
            ...forbiddenMatches.map((input) => `- ${input}`)
        ].join('\n'))
    }

    const { size: rawSize } = await stat(handlerPath)
    const gzipSize = (await gzipAsync(handlerCode)).length
    const handlerLabel = relative(appPath, handlerPath)

    console.log(`Cloudflare Worker handler size (${handlerLabel}): raw ${formatBytes(rawSize)}, gzip ${formatBytes(gzipSize)}`)
}

async function listFiles(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
        const entryPath = join(dir, entry.name)
        if (entry.isDirectory()) {
            files.push(...await listFiles(entryPath))
        } else if (entry.isFile()) {
            files.push(entryPath)
        }
    }

    return files
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatBytes(bytes: number) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
}

async function importCloudflareCliModule<T>(relativePath: string): Promise<T> {
    return import(pathToFileURL(join(cloudflarePackageRoot, relativePath)).href) as Promise<T>
}

async function importAwsModule<T>(specifier: string): Promise<T> {
    return import(pathToFileURL(cloudflareRequire.resolve(specifier)).href) as Promise<T>
}
