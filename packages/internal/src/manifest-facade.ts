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
    `const masterCSSManifestSpecifier = typeof masterCSSManifestURL === 'string' ? masterCSSManifestURL : masterCSSManifestURL.href;`,
    `let loadMasterCSSManifestModule;`,
    `try {`,
    `    loadMasterCSSManifestModule = new Function('specifier', "return import(specifier, { with: { type: 'json' } })");`,
    `} catch (error) {`,
    `    if (error?.name !== 'SyntaxError') throw error;`,
    `}`,
    `let masterCSSManifest;`,
    `if (loadMasterCSSManifestModule) {`,
    `    masterCSSManifest = (await loadMasterCSSManifestModule(masterCSSManifestSpecifier)).default;`,
    `} else {`,
    `    const response = await fetch(masterCSSManifestSpecifier);`,
    `    if (!response.ok) throw new Error(\`Cannot load the Master CSS manifest from \${masterCSSManifestSpecifier} (HTTP \${response.status}).\`);`,
    `    masterCSSManifest = await response.json();`,
    `}`,
    `export default masterCSSManifest;`,
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
    `    const specifier = typeof url === 'string' ? url : url.href;`,
    `    return (await load(specifier, { with: { type: 'json' } })).default;`,
    `}`,
    ``,
    `async function loadMasterCSSManifestFromImport(url) {`,
    `    const specifier = typeof url === 'string' ? url : url.href;`,
    `    let load;`,
    `    try {`,
    `        load = new Function('specifier', "return import(specifier, { with: { type: 'json' } })");`,
    `    } catch (error) {`,
    `        if (error?.name !== 'SyntaxError') throw error;`,
    `        const response = await fetch(specifier);`,
    `        if (!response.ok) throw new Error(\`Cannot load the Master CSS manifest from \${specifier} (HTTP \${response.status}).\`);`,
    `        return response.json();`,
    `    }`,
    `    return (await load(specifier)).default;`,
    `}`,
    ``,
    `export default typeof window === 'undefined'`,
    `    ? await loadMasterCSSManifestFromFile(masterCSSManifestURL)`,
    `    : await loadMasterCSSManifestFromImport(masterCSSManifestURL);`,
    ``
  ].join('\n')
}
