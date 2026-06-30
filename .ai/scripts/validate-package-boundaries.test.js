import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import {
    browserSafeIntegrationEntryFiles,
    bundledSourcePackages,
    focusedSourceImportBoundaries,
    forbiddenProductionDependencies,
    sourceFileExtensions,
    strictProductionDependencies
} from './package-boundary-rules.js'

const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
const packagesRoot = path.join(repoRoot, 'packages')
const packageMapPath = path.join(repoRoot, '.ai/package-map.md')

test('package-map public entry points match package.json exports', async () => {
    const packages = await readWorkspacePackages()
    const packageMap = await readPackageMap()
    const failures = []

    for (const eachPackage of packages.values()) {
        const packageMapEntry = packageMap.get(eachPackage.name)
        if (!packageMapEntry) {
            failures.push(`${eachPackage.name} | missing from .ai/package-map.md`)
            continue
        }

        const actualExports = exportEntryPoints(eachPackage.packageJSON.exports)
        if (!actualExports.length) continue

        const documentedExports = packageMapEntry.entryPoints.filter((entryPoint) => entryPoint.startsWith('.'))
        if (!sameSet(actualExports, documentedExports)) {
            failures.push(`${eachPackage.name} | package.json exports ${formatList(actualExports)} != .ai/package-map.md ${formatList(documentedExports)}`)
        }
    }

    assert.deepEqual(failures, [])
})

test('package-local AI notes cover package responsibility basics', async () => {
    const packages = await readWorkspacePackages()
    const requiredSections = ['## Responsibility', '## Owns', '## Does Not Own', '## Public Surface', '## Validation']
    const failures = []

    for (const eachPackage of packages.values()) {
        const aiPath = path.join(eachPackage.dir, 'AI.md')
        let content
        try {
            content = await readFile(aiPath, 'utf8')
        } catch {
            failures.push(`${relativePath(aiPath)} | missing package-local AI.md`)
            continue
        }

        for (const eachSection of requiredSections) {
            if (!content.includes(eachSection)) {
                failures.push(`${relativePath(aiPath)} | missing ${eachSection}`)
            }
        }
    }

    assert.deepEqual(failures, [])
})

test('production workspace dependencies follow package ownership boundaries', async () => {
    const packages = await readWorkspacePackages()
    const failures = []

    for (const [name, allowed] of strictProductionDependencies) {
        const eachPackage = packages.get(name)
        if (!eachPackage) {
            failures.push(`${name} | package not found`)
            continue
        }

        const actual = productionWorkspaceDependencies(eachPackage, packages)
        const unexpected = actual.filter((dependency) => !allowed.includes(dependency))
        if (unexpected.length) {
            failures.push(`${name} | unexpected production dependencies ${formatList(unexpected)}; allowed ${formatList(allowed)}`)
        }
    }

    for (const [name, forbidden] of forbiddenProductionDependencies) {
        const eachPackage = packages.get(name)
        if (!eachPackage) continue
        const actual = productionWorkspaceDependencies(eachPackage, packages)
        const violations = actual.filter((dependency) => forbidden.includes(dependency))
        if (violations.length) {
            failures.push(`${name} | forbidden production dependencies ${formatList(violations)}`)
        }
    }

    assert.deepEqual(failures, [])
})

test('production workspace dependency graph has no cycles', async () => {
    const packages = await readWorkspacePackages()
    const graph = new Map()
    const cycles = []

    for (const eachPackage of packages.values()) {
        graph.set(eachPackage.name, productionWorkspaceDependencies(eachPackage, packages))
    }

    for (const name of graph.keys()) {
        findCycles(name, graph, [], new Set(), cycles)
    }

    assert.deepEqual([...new Set(cycles)], [])
})

test('source value imports use production workspace dependencies', async () => {
    const packages = await readWorkspacePackages()
    const packageNames = [...packages.keys()].sort((a, b) => b.length - a.length)
    const failures = []

    for (const eachPackage of packages.values()) {
        if (bundledSourcePackages.has(eachPackage.name)) continue

        const sourceDir = path.join(eachPackage.dir, 'src')
        if (!await pathExists(sourceDir)) continue

        const declaredProductionDependencies = new Set(productionWorkspaceDependencies(eachPackage, packages))
        const files = await listSourceFiles(sourceDir)
        for (const eachFile of files) {
            const content = await readFile(eachFile, 'utf8')
            for (const eachImport of parseImports(content)) {
                if (eachImport.typeOnly) continue
                const dependencyName = resolveWorkspaceSpecifier(eachImport.specifier, packageNames)
                if (!dependencyName || dependencyName === eachPackage.name) continue
                if (!declaredProductionDependencies.has(dependencyName)) {
                    failures.push(`${relativePath(eachFile)} | value import ${eachImport.specifier} requires ${dependencyName} in dependencies or peerDependencies`)
                }
            }
        }
    }

    assert.deepEqual(failures, [])
})

for (const eachBoundary of focusedSourceImportBoundaries) {
    test(eachBoundary.name, async () => {
        const packages = await readWorkspacePackages()
        const packageNames = [...packages.keys()].sort((a, b) => b.length - a.length)
        const sourceDir = path.join(packagesRoot, eachBoundary.packageDir, 'src')
        const failures = await findForbiddenWorkspaceValueImports(
            sourceDir,
            packageNames,
            new Set(eachBoundary.forbiddenWorkspaceImports)
        )

        assert.deepEqual(failures, [])
    })
}

test('integration browser-safe subpaths do not import Node-only APIs', async () => {
    const failures = []
    const files = new Set()

    for (const entryFile of browserSafeIntegrationEntryFiles) {
        await collectRelativeImports(path.join(repoRoot, 'packages/integration', entryFile), files)
    }

    for (const eachFile of [...files].sort((a, b) => relativePath(a).localeCompare(relativePath(b)))) {
        const content = await readFile(eachFile, 'utf8')
        const imports = parseImports(content)
        const nodeImports = imports
            .filter((eachImport) => isNodeOnlySpecifier(eachImport.specifier))
            .map((eachImport) => eachImport.specifier)
        if (nodeImports.length) {
            failures.push(`${relativePath(eachFile)} | Node-only imports ${formatList(nodeImports)}`)
        }

        const strippedContent = stripStringsAndComments(content)
        const globals = [...new Set(strippedContent.match(/\b(?:Buffer|process|__dirname|__filename)\b/g) || [])]
        if (globals.length) {
            failures.push(`${relativePath(eachFile)} | Node globals ${formatList(globals)}`)
        }
    }

    assert.deepEqual(failures, [])
})

async function readWorkspacePackages() {
    const packages = new Map()
    const entries = await readdir(packagesRoot, { withFileTypes: true })

    for (const eachEntry of entries) {
        if (!eachEntry.isDirectory()) continue
        const dir = path.join(packagesRoot, eachEntry.name)
        const packageJSONPath = path.join(dir, 'package.json')
        if (!await pathExists(packageJSONPath)) continue
        const packageJSON = JSON.parse(await readFile(packageJSONPath, 'utf8'))
        packages.set(packageJSON.name, {
            name: packageJSON.name,
            dir,
            packageJSON,
            packageJSONPath
        })
    }

    return packages
}

async function readPackageMap() {
    const content = await readFile(packageMapPath, 'utf8')
    const rows = new Map()

    for (const eachLine of content.split('\n')) {
        const match = /^\| `([^`]+)` \| ([^|]+) \|/.exec(eachLine)
        if (!match) continue
        rows.set(match[1], {
            entryPoints: [...match[2].matchAll(/`([^`]+)`/g)].map((entryMatch) => entryMatch[1])
        })
    }

    return rows
}

function exportEntryPoints(exportsValue) {
    if (!exportsValue) return []
    if (typeof exportsValue === 'string') return ['.']
    if (typeof exportsValue !== 'object') return []
    return Object.keys(exportsValue).sort()
}

function productionWorkspaceDependencies(eachPackage, packages) {
    return Object.keys({
        ...eachPackage.packageJSON.dependencies,
        ...eachPackage.packageJSON.peerDependencies
    })
        .filter((dependency) => packages.has(dependency))
        .sort()
}

function findCycles(name, graph, stack, active, cycles) {
    if (active.has(name)) {
        cycles.push([...stack.slice(stack.indexOf(name)), name].join(' -> '))
        return
    }
    if (stack.includes(name)) return

    active.add(name)
    stack.push(name)
    for (const dependency of graph.get(name) || []) {
        findCycles(dependency, graph, stack, active, cycles)
    }
    stack.pop()
    active.delete(name)
}

async function findForbiddenWorkspaceValueImports(sourceDir, packageNames, forbiddenImports) {
    const failures = []
    if (!await pathExists(sourceDir)) return failures

    const files = await listSourceFiles(sourceDir)
    for (const eachFile of files) {
        const content = await readFile(eachFile, 'utf8')
        for (const eachImport of parseImports(content)) {
            if (eachImport.typeOnly) continue
            const dependencyName = resolveWorkspaceSpecifier(eachImport.specifier, packageNames)
            if (dependencyName && forbiddenImports.has(dependencyName)) {
                failures.push(`${relativePath(eachFile)} | forbidden value import ${eachImport.specifier}`)
            }
        }
    }

    return failures
}

async function listSourceFiles(dir) {
    const result = []
    const entries = await readdir(dir, { withFileTypes: true })
    for (const eachEntry of entries) {
        const eachPath = path.join(dir, eachEntry.name)
        if (eachEntry.isDirectory()) {
            result.push(...await listSourceFiles(eachPath))
        } else if (sourceFileExtensions.has(path.extname(eachPath))) {
            result.push(eachPath)
        }
    }
    return result
}

function parseImports(content) {
    const source = stripTemplateLiteralsAndComments(content)
    const imports = []
    const patterns = [
        /^\s*import\s+type\s+[^'"]*?\s+from\s+['"]([^'"]+)['"]/gm,
        /^\s*export\s+type\s+[^'"]*?\s+from\s+['"]([^'"]+)['"]/gm,
        /^\s*import\s+(?!type\b)([^'"]*?)\s+from\s+['"]([^'"]+)['"]/gm,
        /^\s*export\s+(?!type\b)[^\n'"]*?\s+from\s+['"]([^'"]+)['"]/gm,
        /^\s*import\s*\(\s*['"]([^'"]+)['"]\s*\)/gm,
        /^\s*(?:const|let|var)?\s*[^=\n]*=?\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/gm
    ]

    for (const match of source.matchAll(patterns[0])) {
        imports.push({ specifier: match[1], typeOnly: true })
    }
    for (const match of source.matchAll(patterns[1])) {
        imports.push({ specifier: match[1], typeOnly: true })
    }
    for (const match of source.matchAll(patterns[2])) {
        const clause = match[1].trim()
        imports.push({ specifier: match[2], typeOnly: isTypeOnlyImportClause(clause) })
    }
    for (const match of source.matchAll(patterns[3])) {
        imports.push({ specifier: match[1], typeOnly: false })
    }
    for (const match of source.matchAll(patterns[4])) {
        imports.push({ specifier: match[1], typeOnly: false })
    }
    for (const match of source.matchAll(patterns[5])) {
        imports.push({ specifier: match[1], typeOnly: false })
    }

    return imports
}

function isTypeOnlyImportClause(clause) {
    if (!clause) return false
    return /^\{\s*type\b[^}]*\}$/.test(clause)
}

function resolveWorkspaceSpecifier(specifier, packageNames) {
    return packageNames.find((name) => specifier === name || specifier.startsWith(`${name}/`))
}

async function collectRelativeImports(file, files) {
    if (files.has(file)) return
    files.add(file)

    const content = await readFile(file, 'utf8')
    for (const eachImport of parseImports(content)) {
        if (!eachImport.specifier.startsWith('.')) continue
        const resolved = await resolveRelativeSource(file, eachImport.specifier)
        if (resolved) await collectRelativeImports(resolved, files)
    }
}

async function resolveRelativeSource(fromFile, specifier) {
    const base = path.resolve(path.dirname(fromFile), specifier)
    const candidates = [
        base,
        ...[...sourceFileExtensions].map((extension) => `${base}${extension}`),
        ...[...sourceFileExtensions].map((extension) => path.join(base, `index${extension}`))
    ]

    for (const candidate of candidates) {
        if (await pathExists(candidate) && (await stat(candidate)).isFile()) return candidate
    }
}

function isNodeOnlySpecifier(specifier) {
    return specifier.startsWith('node:')
        || ['fs', 'path', 'crypto', 'module', 'url', 'os'].includes(specifier)
}

function stripStringsAndComments(content) {
    return content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/`(?:\\[\s\S]|[^`\\])*`/g, '``')
        .replace(/'(?:\\.|[^'\\])*'/g, "''")
        .replace(/"(?:\\.|[^"\\])*"/g, '""')
}

function stripTemplateLiteralsAndComments(content) {
    return content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/`(?:\\[\s\S]|[^`\\])*`/g, '``')
}

async function pathExists(file) {
    try {
        await stat(file)
        return true
    } catch {
        return false
    }
}

function sameSet(a, b) {
    return a.length === b.length && a.every((value) => b.includes(value))
}

function formatList(values) {
    return `[${values.join(', ')}]`
}

function relativePath(file) {
    return path.relative(repoRoot, file).split(path.sep).join('/')
}
