export const MANIFEST_MODULE_FILE = 'master-css-manifest.js'
export const MANIFEST_ASSET_FILE = 'master-css-manifest.json'
export const MASTER_CSS_MANIFEST_PRELOAD_REL = 'preload'
export const MASTER_CSS_MANIFEST_PRELOAD_AS = 'fetch'
export const MASTER_CSS_MANIFEST_PRELOAD_TYPE = 'application/json'

export interface ManifestPreloadLinkAttrs {
    rel: typeof MASTER_CSS_MANIFEST_PRELOAD_REL
    as: typeof MASTER_CSS_MANIFEST_PRELOAD_AS
    type: typeof MASTER_CSS_MANIFEST_PRELOAD_TYPE
    crossorigin: ''
    href: string
}

function escapeAttributeValue(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
}

export function toInlineManifestModule(json: string) {
    return `export default ${json};`
}

export function toManifestPreloadLinkAttrs(href: string): ManifestPreloadLinkAttrs {
    return {
        rel: MASTER_CSS_MANIFEST_PRELOAD_REL,
        as: MASTER_CSS_MANIFEST_PRELOAD_AS,
        type: MASTER_CSS_MANIFEST_PRELOAD_TYPE,
        crossorigin: '',
        href
    }
}

export function toManifestPreloadLinkTag(href: string) {
    const attrs = toManifestPreloadLinkAttrs(href)
    return [
        '<link',
        `rel="${attrs.rel}"`,
        `as="${attrs.as}"`,
        `type="${attrs.type}"`,
        'crossorigin',
        `href="${escapeAttributeValue(attrs.href)}">`
    ].join(' ')
}

export function toBrowserManifestFacadeModule(urlExpression: string) {
    return [
        `const masterCSSManifestURL = ${urlExpression};`,
        `const masterCSSManifestResponse = await fetch(masterCSSManifestURL);`,
        `if (!masterCSSManifestResponse.ok) {`,
        `    throw new Error(\`Failed to load Master CSS manifest JSON: \${masterCSSManifestResponse.status} \${masterCSSManifestResponse.statusText}\`);`,
        `}`,
        `export default await masterCSSManifestResponse.json();`,
        ``
    ].join('\n')
}

export function toNodeManifestFacadeModule(urlExpression: string) {
    return [
        `import { readFile } from 'node:fs/promises';`,
        `import { fileURLToPath } from 'node:url';`,
        ``,
        `const masterCSSManifestURL = ${urlExpression};`,
        `export default JSON.parse(await readFile(fileURLToPath(new URL(masterCSSManifestURL, import.meta.url).href), 'utf8'));`,
        ``
    ].join('\n')
}

export function toUniversalManifestFacadeModule(urlExpression: string) {
    return [
        `const masterCSSManifestURL = ${urlExpression};`,
        ``,
        `async function loadMasterCSSManifestFromFile(url) {`,
        `    const load = new Function('specifier', 'return import(specifier)');`,
        `    const { readFile } = await load('node:fs/promises');`,
        `    const { fileURLToPath } = await load('node:url');`,
        `    const { join } = await load('node:path');`,
        `    const value = typeof url === 'string' ? url : url.href;`,
        `    const files = value.startsWith('/_next/')`,
        `        ? [`,
        `            join(process.cwd(), '.next', value.slice('/_next/'.length)),`,
        `            join(process.cwd(), '.next/dev', value.slice('/_next/'.length))`,
        `        ]`,
        `        : [fileURLToPath(value)];`,
        `    let lastError;`,
        `    for (const file of files) {`,
        `        try {`,
        `            return JSON.parse(await readFile(file, 'utf8'));`,
        `        } catch (error) {`,
        `            lastError = error;`,
        `        }`,
        `    }`,
        `    throw lastError;`,
        `}`,
        ``,
        `async function loadMasterCSSManifestFromFetch(url) {`,
        `    const response = await fetch(url);`,
        `    if (!response.ok) {`,
        `        throw new Error(\`Failed to load Master CSS manifest JSON: \${response.status} \${response.statusText}\`);`,
        `    }`,
        `    return response.json();`,
        `}`,
        ``,
        `export default typeof window === 'undefined'`,
        `    ? await loadMasterCSSManifestFromFile(masterCSSManifestURL)`,
        `    : await loadMasterCSSManifestFromFetch(masterCSSManifestURL);`,
        ``
    ].join('\n')
}
