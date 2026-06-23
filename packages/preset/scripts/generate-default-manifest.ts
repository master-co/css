import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MasterCSS } from '@master/css-engine'
import { normalizeMasterCSSManifestForJSON, stringifyMasterCSSManifestJSON } from 'shared/master-css-manifest-json'
import type { MasterCSSManifest } from 'shared/master-css-manifest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const sourceFile = resolve(packageRoot, 'src/index.css')
const outputFile = resolve(packageRoot, 'src/default-manifest.json')
const defaultEngineSettings = MasterCSS.create({ manifest: { version: 1 } }).settings
const { compileCSSManifestFile } = await import(new URL('../../compiler/src/index.ts', import.meta.url).href) as typeof import('@master/css-compiler')
function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

function isDefaultSettingValue(value: unknown, defaultValue: unknown) {
    if (Array.isArray(value) && Array.isArray(defaultValue)) {
        return value.length === defaultValue.length
            && value.every((item, index) => item === defaultValue[index])
    }
    return value === defaultValue
}

function createDefaultManifestSettings(settings: MasterCSSManifest['settings']): MasterCSSManifest['settings'] {
    if (!settings) return
    const entries = Object.entries(settings).filter(([key, value]) =>
        !isDefaultSettingValue(value, defaultEngineSettings[key as keyof typeof defaultEngineSettings])
    )
    return entries.length ? Object.fromEntries(entries) as MasterCSSManifest['settings'] : undefined
}

export function createDefaultManifest(cssManifest: MasterCSSManifest): MasterCSSManifest {
    const settings = createDefaultManifestSettings(cssManifest.settings)
    return normalizeMasterCSSManifestForJSON({
        version: 1,
        ...(settings ? { settings } : {}),
        ...(cssManifest.variables ? { variables: clone(cssManifest.variables) } : {}),
        ...(cssManifest.animations ? { animations: clone(cssManifest.animations) } : {}),
        ...(cssManifest.variants ? { variants: clone(cssManifest.variants) } : {}),
        ...(cssManifest.atRules ? { atRules: clone(cssManifest.atRules) } : {}),
        ...(cssManifest.breakpointAtRules ? { breakpointAtRules: clone(cssManifest.breakpointAtRules) } : {}),
        ...(cssManifest.containerAtRules ? { containerAtRules: clone(cssManifest.containerAtRules) } : {}),
        ...(cssManifest.selectors ? { selectors: clone(cssManifest.selectors) } : {}),
        ...(cssManifest.utilities ? { utilities: clone(cssManifest.utilities) } : {})
    })
}

export function createDefaultManifestFromSourceFile(file = sourceFile) {
    return createDefaultManifest(compileCSSManifestFile(file).manifest)
}

export function createDefaultManifestJSON(manifest: MasterCSSManifest) {
    return stringifyMasterCSSManifestJSON(manifest)
}

export function writeDefaultManifest(file = outputFile) {
    writeFileSync(file, createDefaultManifestJSON(createDefaultManifestFromSourceFile()))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    writeDefaultManifest()
}
