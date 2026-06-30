import { createHash, randomBytes } from 'node:crypto'
import { existsSync, realpathSync, statSync } from 'node:fs'
import { mkdir, readFile, realpath as realpathAsync, stat, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'

export interface MasterCSSMCPContextOptions {
    root?: string
    roots?: string[]
    previewTTL?: number
}

export interface PreviewChange {
    filePath: string
    beforeText?: string
    afterText: string
}

export interface StoredPreviewChange {
    filePath: string
    beforeHash: string | null
    afterHash: string
    beforeExists: boolean
    beforeBytes: number
    afterBytes: number
    afterText: string
    diff: string
}

export interface StoredPreview {
    confirmToken: string
    createdAt: number
    expiresAt: number
    changes: StoredPreviewChange[]
}

export interface PreviewResult {
    confirmToken?: string
    expiresAt?: number
    changes: StoredPreviewChange[]
    summary: {
        files: number
        bytesBefore: number
        bytesAfter: number
    }
}

const DEFAULT_PREVIEW_TTL = 5 * 60 * 1000

function sha256(text: string) {
    return createHash('sha256').update(text).digest('hex')
}

function isContained(root: string, filePath: string) {
    const path = relative(root, filePath)
    return path === '' || Boolean(path && !path.startsWith('..') && !isAbsolute(path))
}

function assertFilePattern(pattern: string) {
    if (isAbsolute(pattern)) {
        throw new Error(`Absolute glob patterns are not allowed: ${pattern}`)
    }
    if (pattern.split(/[\\/]+/).includes('..')) {
        throw new Error(`Glob patterns may not escape the workspace root: ${pattern}`)
    }
}

function formatDiff(filePath: string, beforeText: string, afterText: string) {
    if (beforeText === afterText) return ''
    const beforeLines = beforeText.length ? beforeText.split('\n') : []
    const afterLines = afterText.length ? afterText.split('\n') : []
    return [
        `--- ${filePath}`,
        `+++ ${filePath}`,
        '@@',
        ...beforeLines.map((line) => `-${line}`),
        ...afterLines.map((line) => `+${line}`)
    ].join('\n')
}

export default class MasterCSSMCPContext {
    readonly root: string
    readonly roots: string[]
    readonly previewTTL: number
    private readonly containmentRoots: string[]
    private previews = new Map<string, StoredPreview>()

    constructor(options: MasterCSSMCPContextOptions = {}) {
        const configuredRoots = options.roots?.length ? options.roots : [options.root || process.cwd()]
        const roots: string[] = []
        const containmentRoots: string[] = []
        for (const root of configuredRoots) {
            const resolved = resolve(root)
            if (!existsSync(resolved)) {
                throw new Error(`Workspace root does not exist: ${resolved}`)
            }
            const real = realpathSync(resolved)
            if (!statSync(real).isDirectory()) {
                throw new Error(`Workspace root is not a directory: ${real}`)
            }
            roots.push(real)
            containmentRoots.push(real, resolved)
        }
        this.roots = roots
        this.root = this.roots[0]
        this.containmentRoots = [...new Set(containmentRoots)]
        this.previewTTL = options.previewTTL ?? DEFAULT_PREVIEW_TTL
    }

    assertContained(filePath: string) {
        const resolvedPath = resolve(filePath)
        if (!this.containmentRoots.some((root) => isContained(root, resolvedPath))) {
            throw new Error(`Path is outside the allowed workspace roots: ${filePath}`)
        }
        return resolvedPath
    }

    resolveVirtualPath(filePath: string) {
        const resolved = resolve(this.root, filePath)
        return this.assertContained(resolved)
    }

    async resolveExistingFile(filePath: string) {
        const resolved = resolve(this.root, filePath)
        const realPath = await realpath(resolved)
        this.assertContained(realPath)
        const fileStat = await stat(realPath)
        if (!fileStat.isFile()) {
            throw new Error(`Path is not a file: ${realPath}`)
        }
        return realPath
    }

    async resolveWritableFile(filePath: string) {
        const resolved = resolve(this.root, filePath)
        if (existsSync(resolved)) {
            const realPath = await realpath(resolved)
            this.assertContained(realPath)
            const fileStat = await stat(realPath)
            if (!fileStat.isFile()) {
                throw new Error(`Path is not a file: ${realPath}`)
            }
            return realPath
        }
        this.assertContained(resolved)
        const parent = await realpath(dirname(resolved))
        this.assertContained(parent)
        return resolved
    }

    validateGlobPatterns(patterns: string[]) {
        for (const pattern of patterns) assertFilePattern(pattern)
    }

    async createPreview(changes: PreviewChange[], ttl = this.previewTTL): Promise<PreviewResult> {
        const storedChanges: StoredPreviewChange[] = []
        for (const change of changes) {
            const filePath = await this.resolveWritableFile(change.filePath)
            const beforeText = change.beforeText ?? await readFileIfExists(filePath)
            if (beforeText === change.afterText) continue
            const beforeExists = existsSync(filePath)
            storedChanges.push({
                filePath,
                beforeHash: beforeExists ? sha256(beforeText) : null,
                afterHash: sha256(change.afterText),
                beforeExists,
                beforeBytes: beforeText.length,
                afterBytes: change.afterText.length,
                afterText: change.afterText,
                diff: formatDiff(filePath, beforeText, change.afterText)
            })
        }

        const summary = {
            files: storedChanges.length,
            bytesBefore: storedChanges.reduce((total, change) => total + change.beforeBytes, 0),
            bytesAfter: storedChanges.reduce((total, change) => total + change.afterBytes, 0)
        }

        if (!storedChanges.length) {
            return {
                changes: [],
                summary
            }
        }

        const confirmToken = randomBytes(24).toString('base64url')
        const createdAt = Date.now()
        const expiresAt = createdAt + ttl
        this.previews.set(confirmToken, {
            confirmToken,
            createdAt,
            expiresAt,
            changes: storedChanges
        })
        return {
            confirmToken,
            expiresAt,
            changes: storedChanges,
            summary
        }
    }

    async applyPreview(confirmToken: string) {
        const preview = this.previews.get(confirmToken)
        if (!preview) {
            throw new Error('Unknown or already applied preview token.')
        }
        if (preview.expiresAt < Date.now()) {
            this.previews.delete(confirmToken)
            throw new Error('Preview token has expired.')
        }

        for (const change of preview.changes) {
            const filePath = await this.resolveWritableFile(change.filePath)
            if (filePath !== change.filePath) {
                throw new Error(`Preview path changed while applying: ${change.filePath}`)
            }
            const currentText = await readFileIfExists(filePath)
            const currentExists = existsSync(filePath)
            if (change.beforeHash === null) {
                if (currentExists) {
                    throw new Error(`File was created after preview generation: ${filePath}`)
                }
            } else if (sha256(currentText) !== change.beforeHash) {
                throw new Error(`File changed after preview generation: ${filePath}`)
            }
        }

        for (const change of preview.changes) {
            await mkdir(dirname(change.filePath), { recursive: true })
            await writeFile(change.filePath, change.afterText)
        }
        this.previews.delete(confirmToken)
        return {
            applied: true,
            changes: preview.changes.map(({ filePath, afterHash }) => ({ filePath, afterHash }))
        }
    }
}

async function realpath(filePath: string) {
    try {
        return await realpathAsync(filePath)
    } catch (error) {
        throw new Error(`Unable to resolve path: ${filePath}${error instanceof Error ? ` (${error.message})` : ''}`)
    }
}

async function readFileIfExists(filePath: string) {
    try {
        return await readFile(filePath, 'utf8')
    } catch (error) {
        if (typeof error === 'object' && error && 'code' in error && error.code === 'ENOENT') return ''
        throw error
    }
}
