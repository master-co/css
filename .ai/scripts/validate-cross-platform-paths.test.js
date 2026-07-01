import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import ts from 'typescript'

const repoRoot = process.env.CROSS_PLATFORM_PATH_REPO_ROOT
    ? path.resolve(process.env.CROSS_PLATFORM_PATH_REPO_ROOT)
    : fileURLToPath(new URL('../../', import.meta.url))
const baselinePath = path.join(repoRoot, '.ai', 'cross-platform-path-baseline.json')
const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts'])
const ignoredPathSegments = new Set([
    '.cache',
    '.next',
    '.nuxt',
    '.output',
    '.svelte-kit',
    '.tsbuild',
    '.turbo',
    'coverage',
    'dist',
    'node_modules'
])
const scannedPathPrefixes = [
    '.ai/scripts/',
    '.github/',
    'benchmarks/',
    'examples/',
    'internal/',
    'packages/',
    'shared/',
    'site/'
]
const rootSourceFiles = new Set([
    'eslint.config.js',
    'submodules.js'
])
const pathFunctionNames = new Set(['join', 'resolve', 'relative'])
const assertionNames = new Set(['toBe', 'toContain', 'toEqual', 'toStrictEqual'])
const pathLikeIdentifierPattern = /\b(?:absolute|child|cwd|dep(?:endency)?|dir(?:name)?|file(?:name|path)?|fsPath|parent|path|root|source|target|workspace)\b/i
const nonFilesystemIdentifierPattern = /\b(?:asset|class|css|href|id|import|route|selector|specifier|token|url|virtual)\b/i
const allowedSlashContextPattern = /\b(?:asset|href|import|normalizePath|posix|publicPath|specifier|toPosixPath|url|virtual)\b/i

if (process.env.UPDATE_CROSS_PLATFORM_PATH_BASELINE === '1') {
    await updateBaseline()
    process.exit(0)
}

test('cross-platform path scanner classifies accepted and rejected patterns', () => {
    const source = `
        import path from 'node:path'
        import { join as joinPath } from 'node:path'

        const unsafePathCall = path.join(root, 'app/globals.css')
        const unsafeAliasCall = joinPath(root, 'src/App.tsx')
        const unsafeContainment = filePath.startsWith(root)
        const unsafeNormalization = filePath.replace(/\\\\/g, '/')
        expect(output).toBe('app/page.tsx')

        function toPosixPath(filePath) {
            return filePath.split(path.sep).join('/')
        }

        const href = '/_next/static/chunk.js'
        expect(href).toBe('/_next/static/chunk.js')
        const virtualId = 'virtual:master-css/app.css'
        const specifier = '@master/css/runtime'
    `

    assert.deepEqual(
        analyzeSource('packages/example/tests/path.test.ts', source).map((issue) => issue.rule),
        [
            'embedded-path-segment',
            'embedded-path-segment',
            'raw-path-starts-with',
            'manual-slash-normalization',
            'slash-path-assertion'
        ]
    )
})

test('repository source does not add unbaselined cross-platform path risks', async () => {
    const issues = await scanRepository()
    const actualCounts = countIssueKeys(issues)
    const baseline = await readBaseline()
    const baselineCounts = baseline.issues || {}
    const added = diffIssueCounts(actualCounts, baselineCounts)
    const stale = diffIssueCounts(baselineCounts, actualCounts)

    assert.deepEqual(formatCountDiffs('new or changed cross-platform path risks', added, issues), [])
    assert.deepEqual(formatCountDiffs('stale cross-platform path baseline entries', stale, issues), [])
})

async function updateBaseline() {
    const issues = await scanRepository()
    const baseline = {
        version: 1,
        description: 'Baseline for existing cross-platform path risks. New entries require review.',
        issues: Object.fromEntries(
            [...countIssueKeys(issues).entries()]
                .sort(([a], [b]) => a.localeCompare(b))
        )
    }

    await mkdir(path.dirname(baselinePath), { recursive: true })
    await writeFile(baselinePath, `${JSON.stringify(baseline, null, 4)}\n`)
    console.log(`Wrote ${Object.keys(baseline.issues).length} cross-platform path baseline entries.`)
}

async function scanRepository() {
    const issues = []
    const files = await listTrackedSourceFiles()

    for (const eachFile of files) {
        const absoluteFile = path.join(repoRoot, eachFile)
        const source = await readFile(absoluteFile, 'utf8')
        issues.push(...analyzeSource(eachFile, source))
    }

    return issues.sort((a, b) => a.key.localeCompare(b.key))
}

async function listTrackedSourceFiles() {
    const files = new Set()
    let gitOutput = ''

    try {
        gitOutput = execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
    } catch {
        gitOutput = ''
    }

    for (const eachFile of gitOutput.split('\n')) {
        if (shouldScanRelativeFile(eachFile)) files.add(eachFile)
    }

    const self = '.ai/scripts/validate-cross-platform-paths.test.js'
    if (await pathExists(path.join(repoRoot, self))) files.add(self)

    return [...files].sort()
}

function analyzeSource(relativeFile, source) {
    const sourceFile = ts.createSourceFile(relativeFile, source, ts.ScriptTarget.Latest, true, scriptKindForFile(relativeFile))
    const aliases = collectPathAliases(sourceFile)
    const issues = []

    visit(sourceFile, [])
    return issues

    function visit(node, ancestors) {
        if (ts.isCallExpression(node)) {
            const pathCallName = getPathCallName(node.expression, aliases)
            if (pathCallName && pathFunctionNames.has(pathCallName)) {
                addEmbeddedPathSegmentIssue(relativeFile, sourceFile, node, pathCallName, issues)
            }

            if (isRawPathStartsWithCall(node, sourceFile, ancestors)) {
                addIssue(relativeFile, sourceFile, node, issues, 'raw-path-starts-with', 'Use path.relative() containment checks instead of raw startsWith() on filesystem paths.')
            }

            if (isManualSlashNormalization(node, sourceFile, ancestors)) {
                addIssue(relativeFile, sourceFile, node, issues, 'manual-slash-normalization', 'Keep slash normalization inside explicit URL, virtual id, import specifier, or POSIX helper domains.')
            }

            if (isSlashPathAssertion(relativeFile, node, sourceFile)) {
                addIssue(relativeFile, sourceFile, node, issues, 'slash-path-assertion', 'Compare filesystem paths with node:path helpers or segment arrays in tests.')
            }
        }

        ts.forEachChild(node, (child) => visit(child, [...ancestors, node]))
    }
}

function collectPathAliases(sourceFile) {
    const namespaces = new Set()
    const namedFunctions = new Map()

    for (const statement of sourceFile.statements) {
        if (ts.isImportDeclaration(statement) && isPathModuleSpecifier(statement.moduleSpecifier)) {
            const clause = statement.importClause
            if (clause?.name) namespaces.add(clause.name.text)
            const bindings = clause?.namedBindings
            if (bindings && ts.isNamespaceImport(bindings)) namespaces.add(bindings.name.text)
            if (bindings && ts.isNamedImports(bindings)) {
                for (const element of bindings.elements) {
                    const importedName = element.propertyName?.text || element.name.text
                    namedFunctions.set(element.name.text, importedName)
                }
            }
        }

        if (ts.isVariableStatement(statement)) {
            for (const declaration of statement.declarationList.declarations) {
                if (!declaration.initializer || !isPathRequireCall(declaration.initializer)) continue
                if (ts.isIdentifier(declaration.name)) {
                    namespaces.add(declaration.name.text)
                } else if (ts.isObjectBindingPattern(declaration.name)) {
                    for (const element of declaration.name.elements) {
                        if (!ts.isIdentifier(element.name)) continue
                        const importedName = element.propertyName && ts.isIdentifier(element.propertyName)
                            ? element.propertyName.text
                            : element.name.text
                        namedFunctions.set(element.name.text, importedName)
                    }
                }
            }
        }
    }

    return { namespaces, namedFunctions }
}

function addEmbeddedPathSegmentIssue(relativeFile, sourceFile, node, pathCallName, issues) {
    const slashArgs = node.arguments
        .filter(isStringLiteralLike)
        .map((argument) => argument.text)
        .filter(hasEmbeddedPathSlash)

    if (!slashArgs.length) return
    addIssue(
        relativeFile,
        sourceFile,
        node,
        issues,
        'embedded-path-segment',
        `Pass ${pathCallName}() filesystem path segments separately instead of embedding slashes: ${slashArgs.join(', ')}.`
    )
}

function addIssue(relativeFile, sourceFile, node, issues, rule, message) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
    const snippet = compactSnippet(node.getText(sourceFile))
    const issue = {
        rule,
        file: relativeFile,
        line: line + 1,
        column: character + 1,
        snippet,
        message
    }
    issue.key = createIssueKey(issue)
    issues.push(issue)
}

function getPathCallName(expression, aliases) {
    if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression)) {
        if (aliases.namespaces.has(expression.expression.text)) return expression.name.text
    }

    if (ts.isIdentifier(expression)) return aliases.namedFunctions.get(expression.text)
}

function isRawPathStartsWithCall(node, sourceFile, ancestors) {
    if (!ts.isPropertyAccessExpression(node.expression)) return false
    if (node.expression.name.text !== 'startsWith') return false
    if (isAllowedDomainContext(node, sourceFile, ancestors)) return false

    const receiverText = node.expression.expression.getText(sourceFile)
    const argumentText = node.arguments.map((argument) => argument.getText(sourceFile)).join(' ')
    return isPathLikeExpressionText(receiverText) || isPathLikeExpressionText(argumentText)
}

function isManualSlashNormalization(node, sourceFile, ancestors) {
    if (isAllowedDomainContext(node, sourceFile, ancestors)) return false

    if (ts.isPropertyAccessExpression(node.expression)) {
        const methodName = node.expression.name.text
        if ((methodName === 'replace' || methodName === 'replaceAll') && isBackslashToSlashReplacement(node)) {
            return true
        }

        if (methodName === 'join' && isSplitThenJoinSlash(node, sourceFile)) {
            return true
        }
    }

    return false
}

function isSlashPathAssertion(relativeFile, node, sourceFile) {
    if (!isTestFile(relativeFile)) return false
    if (!ts.isPropertyAccessExpression(node.expression)) return false
    if (!assertionNames.has(node.expression.name.text)) return false
    if (isAllowedAssertionDomain(node, sourceFile)) return false

    return node.arguments.some((argument) => containsFilesystemPathLiteral(argument))
}

function isBackslashToSlashReplacement(node) {
    const [pattern, replacement] = node.arguments
    if (!replacement || !isStringLiteralLike(replacement) || replacement.text !== '/') return false
    if (isStringLiteralLike(pattern)) return pattern.text.includes('\\')
    return pattern?.kind === ts.SyntaxKind.RegularExpressionLiteral
        && pattern.getText().includes('\\\\')
}

function isSplitThenJoinSlash(node, sourceFile) {
    const [joiner] = node.arguments
    if (!joiner || !isStringLiteralLike(joiner) || joiner.text !== '/') return false
    if (!ts.isCallExpression(node.expression.expression)) return false

    const splitCall = node.expression.expression
    if (!ts.isPropertyAccessExpression(splitCall.expression) || splitCall.expression.name.text !== 'split') return false
    const [splitter] = splitCall.arguments
    if (!splitter) return false

    const splitterText = splitter.getText(sourceFile)
    return splitterText.includes('sep')
        || splitterText.includes('\\\\')
        || splitterText.includes('[\\\\/]')
}

function containsFilesystemPathLiteral(node) {
    if (isStringLiteralLike(node)) return looksLikeFilesystemPathLiteral(node.text)
    if (ts.isArrayLiteralExpression(node)) return node.elements.some(containsFilesystemPathLiteral)
    if (ts.isObjectLiteralExpression(node)) {
        return node.properties.some((property) => {
            if (ts.isPropertyAssignment(property)) return containsFilesystemPathLiteral(property.initializer)
            return false
        })
    }
    return false
}

function isAllowedAssertionDomain(node, sourceFile) {
    const callText = node.getText(sourceFile)
    return /\b(?:asset|href|import|route|specifier|url|virtual)\b/i.test(callText)
}

function isAllowedDomainContext(node, sourceFile, ancestors) {
    const text = [
        node.getText(sourceFile),
        ...ancestors.map((ancestor) => getDeclarationContextName(ancestor)).filter(Boolean)
    ].join(' ')

    return allowedSlashContextPattern.test(text)
}

function getDeclarationContextName(node) {
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isMethodDeclaration(node)) {
        return node.name?.getText()
    }

    if (ts.isVariableDeclaration(node)) return node.name.getText()
    if (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) return node.name.getText()
}

function isPathLikeExpressionText(text) {
    return pathLikeIdentifierPattern.test(text) && !nonFilesystemIdentifierPattern.test(text)
}

function looksLikeFilesystemPathLiteral(value) {
    if (!hasEmbeddedPathSlash(value)) return false
    if (isURLLikeLiteral(value) || isImportSpecifierLikeLiteral(value)) return false
    return /(?:^\.{1,2}[\\/]|^[A-Za-z]:[\\/]|^[\\/]|[\\/](?:app|dist|node_modules|packages|src|tests?)[\\/]|[\\/][^\\/]+\.[A-Za-z0-9]+$|^[^\\/]+\.[A-Za-z0-9]+[\\/])/.test(value)
}

function isURLLikeLiteral(value) {
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
        || value.startsWith('data:')
        || value.startsWith('file:')
        || value.startsWith('virtual:')
        || value.startsWith('/_next/')
        || value.startsWith('/assets/')
        || value.startsWith('/static/')
}

function isImportSpecifierLikeLiteral(value) {
    return /^@[^\\/]+\/[^\\/]+(?:\/[^\\/]+)*$/.test(value)
        || /^[a-z0-9._-]+\/[a-z0-9._/-]+$/i.test(value) && !value.includes('.')
}

function isStringLiteralLike(node) {
    return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
}

function hasEmbeddedPathSlash(value) {
    return /[\\/]/.test(value) && value !== '/' && value !== '\\'
}

function isPathModuleSpecifier(node) {
    return isStringLiteralLike(node) && (node.text === 'path' || node.text === 'node:path')
}

function isPathRequireCall(node) {
    return ts.isCallExpression(node)
        && ts.isIdentifier(node.expression)
        && node.expression.text === 'require'
        && node.arguments.length === 1
        && isPathModuleSpecifier(node.arguments[0])
}

function scriptKindForFile(file) {
    if (file.endsWith('.tsx')) return ts.ScriptKind.TSX
    if (file.endsWith('.jsx')) return ts.ScriptKind.JSX
    if (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs')) return ts.ScriptKind.JS
    return ts.ScriptKind.TS
}

function shouldScanRelativeFile(file) {
    if (!file) return false
    if (!sourceExtensions.has(path.extname(file))) return false
    if (file.split('/').some((segment) => ignoredPathSegments.has(segment))) return false
    return rootSourceFiles.has(file)
        || scannedPathPrefixes.some((prefix) => file.startsWith(prefix))
}

function isTestFile(file) {
    return /(?:^|\/)(?:tests?|e2e|__tests__)\//.test(file)
        || /(?:\.test|\.spec)\.[cm]?[jt]sx?$/.test(file)
}

async function readBaseline() {
    try {
        return JSON.parse(await readFile(baselinePath, 'utf8'))
    } catch (error) {
        if (error?.code === 'ENOENT') {
            return { version: 1, issues: {} }
        }
        throw error
    }
}

function countIssueKeys(issues) {
    const counts = new Map()
    for (const issue of issues) {
        counts.set(issue.key, (counts.get(issue.key) || 0) + 1)
    }
    return counts
}

function diffIssueCounts(actual, expected) {
    const diff = []
    for (const [key, actualCount] of countEntries(actual)) {
        const expectedCount = getCount(expected, key)
        if (actualCount > expectedCount) diff.push([key, actualCount - expectedCount])
    }
    return diff
}

function countEntries(counts) {
    return counts instanceof Map ? counts.entries() : Object.entries(counts)
}

function getCount(counts, key) {
    return counts instanceof Map ? counts.get(key) || 0 : counts[key] || 0
}

function formatCountDiffs(title, diffs, issues) {
    if (!diffs.length) return []
    const issueByKey = new Map(issues.map((issue) => [issue.key, issue]))
    return [
        `${title}:`,
        ...diffs.slice(0, 50).map(([key, count]) => {
            const issue = issueByKey.get(key)
            if (!issue) return `${key} (+${count})`
            return `${issue.file}:${issue.line}:${issue.column} ${issue.rule} (+${count}) ${issue.message} | ${issue.snippet}`
        }),
        ...diffs.length > 50 ? [`...and ${diffs.length - 50} more`] : []
    ]
}

function createIssueKey(issue) {
    return `${issue.rule}|${issue.file}|${issue.snippet}`
}

function compactSnippet(text) {
    return text.replace(/\s+/g, ' ').trim().slice(0, 220)
}

async function pathExists(file) {
    try {
        await stat(file)
        return true
    } catch {
        return false
    }
}
