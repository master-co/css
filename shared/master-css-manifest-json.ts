import type { MasterCSSManifest } from './master-css-manifest.js'

type ManifestUtility = NonNullable<MasterCSSManifest['utilities']>[number]

function normalizeTemplateDeclarations(declarations: Record<string, unknown>) {
    const normalized: Record<string, unknown> = {}
    for (const propertyName in declarations) {
        const value = declarations[propertyName]
        normalized[propertyName] = Array.isArray(value)
            ? value.map((part) => part === undefined ? null : part)
            : value === undefined
                ? null
                : value
    }
    return normalized
}

function normalizeUtilityForJSON(utility: ManifestUtility): ManifestUtility {
    if (utility.emit.type !== 'template') return utility
    return {
        ...utility,
        emit: {
            ...utility.emit,
            declarations: normalizeTemplateDeclarations(utility.emit.declarations as Record<string, unknown>)
        }
    }
}

export function normalizeMasterCSSManifestForJSON(manifest: MasterCSSManifest): MasterCSSManifest {
    return manifest.utilities?.length
        ? { ...manifest, utilities: manifest.utilities.map(normalizeUtilityForJSON) }
        : manifest
}

export function stringifyMasterCSSManifestJSON(manifest: MasterCSSManifest): string {
    return JSON.stringify(normalizeMasterCSSManifestForJSON(manifest))
}
