export const MANIFEST_MODULE_FILE = 'master-css-manifest.js'
export const MANIFEST_ASSET_FILE = 'master-css-manifest.json'
export const MASTER_CSS_MANIFEST_PRELOAD_REL = 'modulepreload'
export const MASTER_CSS_MANIFEST_PRELOAD_AS = 'json'

export interface ManifestPreloadLinkAttrs {
  rel: typeof MASTER_CSS_MANIFEST_PRELOAD_REL
  as: typeof MASTER_CSS_MANIFEST_PRELOAD_AS
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
    'crossorigin',
    `href="${escapeAttributeValue(attrs.href)}">`
  ].join(' ')
}

export function toBrowserManifestFacadeModule(urlExpression: string) {
  return [
    `const masterCSSManifestURL = ${urlExpression};`,
    `const loadMasterCSSManifestModule = new Function('specifier', "return import(specifier, { with: { type: 'json' } })");`,
    `const masterCSSManifestModule = await loadMasterCSSManifestModule(typeof masterCSSManifestURL === 'string' ? masterCSSManifestURL : masterCSSManifestURL.href);`,
    `export default masterCSSManifestModule.default;`,
    ``
  ].join('\n')
}

export function toNodeManifestFacadeModule(urlExpression: string) {
  return [
    `import { fileURLToPath, pathToFileURL } from 'node:url';`,
    ``,
    `const masterCSSManifestURL = ${urlExpression};`,
    `const masterCSSManifestFile = fileURLToPath(new URL(masterCSSManifestURL, import.meta.url));`,
    `const masterCSSManifestModule = await import(pathToFileURL(masterCSSManifestFile).href, { with: { type: 'json' } });`,
    `export default masterCSSManifestModule.default;`,
    ``
  ].join('\n')
}

export function toUniversalManifestFacadeModule(urlExpression: string) {
  return [
    `const masterCSSManifestURL = ${urlExpression};`,
    ``,
    `async function loadMasterCSSManifestFromFile(url) {`,
    `    const load = new Function('specifier', 'options', 'return import(specifier, options)');`,
    `    const { fileURLToPath, pathToFileURL } = await load('node:url');`,
    `    const { join } = await load('node:path');`,
    `    const value = typeof url === 'string' ? url : url.href;`,
    `    const files = value.startsWith('/_next/')`,
    `        ? [`,
    `            join(process.cwd(), '.next', value.slice('/_next/'.length)),`,
    `            join(process.cwd(), '.next', 'dev', value.slice('/_next/'.length))`,
    `        ]`,
    `        : [fileURLToPath(value)];`,
    `    let lastError;`,
    `    for (const file of files) {`,
    `        try {`,
    `            const manifestModule = await load(pathToFileURL(file).href, { with: { type: 'json' } });`,
    `            return manifestModule.default;`,
    `        } catch (error) {`,
    `            lastError = error;`,
    `        }`,
    `    }`,
    `    throw lastError;`,
    `}`,
    ``,
    `async function loadMasterCSSManifestFromImport(url) {`,
    `    const specifier = typeof url === 'string' ? url : url.href;`,
    `    const load = new Function('specifier', "return import(specifier, { with: { type: 'json' } })");`,
    `    const manifestModule = await load(specifier);`,
    `    return manifestModule.default;`,
    `}`,
    ``,
    `export default typeof window === 'undefined'`,
    `    ? await loadMasterCSSManifestFromFile(masterCSSManifestURL)`,
    `    : await loadMasterCSSManifestFromImport(masterCSSManifestURL);`,
    ``
  ].join('\n')
}
