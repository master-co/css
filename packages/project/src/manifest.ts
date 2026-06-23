import { extname } from 'node:path'
import { createRequire } from 'node:module'
import {
    compileCSSManifestFile,
    compileCSSManifestJSON,
    compileProjectManifest,
    compileProjectManifestJSON
} from '@master/css-compiler'
import {
    stripResourceQuery
} from '@master/css-integration/manifest-module'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
    type LoadManifestOptions,
    type LoadManifestResult,
    type LoadProjectManifestOptions,
    type LoadProjectManifestResult
} from './options'
import { findCSSManifestEntryFiles } from './entries'

const require = createRequire(import.meta.url)
const defaultManifest = require('@master/css-preset/default-manifest.json') as MasterCSSManifest

export type {
    LoadManifestOptions,
    LoadManifestResult,
    LoadProjectManifestOptions,
    LoadProjectManifestResult
} from './options'

export type ManifestJSONResult = ReturnType<typeof compileCSSManifestJSON>

function withDefaultManifest<T extends LoadManifestOptions>(options: T): T {
    return {
        ...options,
        baseManifest: options.baseManifest ?? defaultManifest
    }
}

export async function loadManifest(path: string, options: LoadManifestOptions = {}): Promise<LoadManifestResult> {
    if (extname(stripResourceQuery(path)) === '.css') {
        return compileCSSManifestFile(stripResourceQuery(path), withDefaultManifest(options))
    }
    throw new TypeError('Master CSS manifests can only be loaded from CSS files.')
}

export async function loadManifestJSON(path: string, options: LoadManifestOptions = {}): Promise<ManifestJSONResult> {
    if (extname(stripResourceQuery(path)) === '.css') {
        return compileCSSManifestJSON(stripResourceQuery(path), withDefaultManifest(options))
    }
    throw new TypeError('Master CSS manifest JSON can only be loaded from CSS files.')
}

export async function loadProjectManifest(projectDir = process.cwd(), options: LoadProjectManifestOptions = {}): Promise<LoadProjectManifestResult> {
    const entries = options.entries ?? await findCSSManifestEntryFiles(projectDir)
    return compileProjectManifest(entries, {
        ...withDefaultManifest(options),
        root: projectDir
    })
}

export async function loadProjectManifestJSON(projectDir = process.cwd(), options: LoadProjectManifestOptions = {}) {
    const entries = options.entries ?? await findCSSManifestEntryFiles(projectDir)
    return compileProjectManifestJSON(entries, {
        ...withDefaultManifest(options),
        root: projectDir
    })
}
