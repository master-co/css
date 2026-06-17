import { createHash } from 'node:crypto'

export const PLAN_MODULE_FILE = 'master-css-plan.js'
export const PLAN_ASSET_FILE = 'master-css-plan.json'

export function toHashedPlanAssetFileName(json: string, basename = 'master-css-plan') {
    const hash = createHash('sha256').update(json).digest('hex').slice(0, 8)
    return `${basename}.${hash}.json`
}

export function toInlinePlanModule(json: string) {
    return `export default ${json};`
}

export function toBrowserPlanFacadeModule(urlExpression: string) {
    return [
        `const masterCSSPlanURL = ${urlExpression};`,
        `const masterCSSPlanResponse = await fetch(masterCSSPlanURL);`,
        `if (!masterCSSPlanResponse.ok) {`,
        `    throw new Error(\`Failed to load Master CSS plan JSON: \${masterCSSPlanResponse.status} \${masterCSSPlanResponse.statusText}\`);`,
        `}`,
        `export default await masterCSSPlanResponse.json();`,
        ``
    ].join('\n')
}

export function toNodePlanFacadeModule(urlExpression: string) {
    return [
        `import { readFile } from 'node:fs/promises';`,
        `import { fileURLToPath } from 'node:url';`,
        ``,
        `const masterCSSPlanURL = ${urlExpression};`,
        `export default JSON.parse(await readFile(fileURLToPath(new URL(masterCSSPlanURL, import.meta.url).href), 'utf8'));`,
        ``
    ].join('\n')
}

export function toUniversalPlanFacadeModule(urlExpression: string) {
    return [
        `const masterCSSPlanURL = ${urlExpression};`,
        ``,
        `async function loadMasterCSSPlanFromFile(url) {`,
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
        `async function loadMasterCSSPlanFromFetch(url) {`,
        `    const response = await fetch(url);`,
        `    if (!response.ok) {`,
        `        throw new Error(\`Failed to load Master CSS plan JSON: \${response.status} \${response.statusText}\`);`,
        `    }`,
        `    return response.json();`,
        `}`,
        ``,
        `export default typeof window === 'undefined'`,
        `    ? await loadMasterCSSPlanFromFile(masterCSSPlanURL)`,
        `    : await loadMasterCSSPlanFromFetch(masterCSSPlanURL);`,
        ``
    ].join('\n')
}
