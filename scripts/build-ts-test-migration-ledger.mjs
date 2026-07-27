import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import * as ts from 'typescript6'

const DEFAULT_BASELINE_REF = 'v2.0.0-rc.87'
const DEFAULT_POST_BASELINE_REF = 'origin/rc'
const RC87_COMMIT = '9cc3e8b5f2e34d5220f10f27ed5ce8186fbcb524'
const RC87_RENDERING_TARGET_COMMIT = 'b242a52a0fcb43b1b506d9fa1e010d0c85621d13'
const RC87_AUTHORING_TARGET_COMMIT = '7ac3c1a63a7af8c8c927a869fa3e4d531261cec6'
const ledgerPath = path.resolve('parity/ts-test-migration-ledger.json')
const evidencePath = path.resolve('parity/ts-test-migration-evidence.json')
const exceptionsPath = path.resolve('parity-exceptions.json')
const reportPath = path.resolve('.ai/reports/rust-test-migration.md')

const sourceExtensions = /\.(?:c|m)?(?:j|t)sx?$/
const legacyOwnerMap = new Map(Object.entries({
  diagnostics: 'compiler',
  engine: 'css',
  facade: 'css',
  integration: 'internal',
  language: 'tooling',
  lexer: 'tooling',
  lint: 'tooling',
  project: 'compiler',
  scanner: 'tooling',
  source: 'tooling',
  stylesheet: 'compiler',
  validator: 'tooling'
}))

const legacyCaseOwnerMap = new Map(Object.entries({
  'rc87-3acbadf9896a963e': 'css'
}))

const corePackages = new Set([
  'astro',
  'compiler',
  'engine',
  'facade',
  'integration',
  'next',
  'nuxt',
  'preset',
  'runtime',
  'server',
  'stylesheet',
  'svelte',
  'vite',
  'webpack'
])

const toolingPackages = new Set([
  'diagnostics',
  'eslint-config',
  'eslint-plugin',
  'language',
  'language-service',
  'lexer',
  'lint',
  'project',
  'scanner',
  'schema',
  'source',
  'validator'
])

function argument(name, fallback) {
  const prefix = `--${name}=`
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback
}

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    ...options
  })
}

function resolveRef(ref) {
  return git(['rev-parse', `${ref}^{commit}`]).trim()
}

function hasRef(ref) {
  try {
    resolveRef(ref)
    return true
  } catch {
    return false
  }
}

function resolveLatestTargetCommit() {
  return git([
    'log',
    '-1',
    '--format=%H',
    'HEAD',
    '--',
    'crates',
    'packages',
    'parity/rust-semantic-corpus.json'
  ]).trim()
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function shortDigest(value) {
  return sha256(value).slice(0, 16)
}

function packageOf(file) {
  return file.split('/')[1]
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeTitle(value) {
  return normalizeWhitespace(value)
    .replace(/\[[0-9]+\]$/u, '')
    .replace(/\s+\/\s+(?:valid|invalid)\[[0-9]+\].*$/u, '')
    .toLowerCase()
}

function exactTitle(value) {
  return normalizeWhitespace(value).toLowerCase()
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
}

function unwrap(node) {
  let current = node
  while (
    current
    && (
      ts.isAsExpression(current)
      || ts.isTypeAssertionExpression(current)
      || ts.isParenthesizedExpression(current)
      || ts.isSatisfiesExpression(current)
      || ts.isNonNullExpression(current)
    )
  ) {
    current = current.expression
  }
  return current
}

function propertyName(node, sourceFile) {
  if (!node) return undefined
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) {
    return node.text
  }
  return node.getText(sourceFile)
}

function literalValue(node, sourceFile) {
  const current = unwrap(node)
  if (!current) return undefined
  if (ts.isStringLiteralLike(current) || ts.isNumericLiteral(current)) return current.text
  if (current.kind === ts.SyntaxKind.TrueKeyword) return true
  if (current.kind === ts.SyntaxKind.FalseKeyword) return false
  if (current.kind === ts.SyntaxKind.NullKeyword) return null
  if (ts.isTemplateExpression(current) && current.templateSpans.length === 0) {
    return current.head.text
  }
  if (ts.isNoSubstitutionTemplateLiteral(current)) return current.text
  return undefined
}

function displayValue(value) {
  if (typeof value === 'string') return normalizeWhitespace(value).slice(0, 180)
  if (value === undefined) return '<dynamic>'
  if (Array.isArray(value)) return value.map(displayValue).join(' | ').slice(0, 180)
  if (value && typeof value === 'object') {
    if ('code' in value) return displayValue(value.code)
    if ('name' in value) return displayValue(value.name)
    if ('label' in value) return displayValue(value.label)
  }
  return JSON.stringify(value).slice(0, 180)
}

function titleValue(node, sourceFile) {
  const value = literalValue(node, sourceFile)
  return value === undefined ? normalizeWhitespace(node?.getText(sourceFile) ?? '<anonymous>') : String(value)
}

function isAncestor(ancestor, node) {
  let current = node
  while (current) {
    if (current === ancestor) return true
    current = current.parent
  }
  return false
}

function lexicalScope(node) {
  let current = node.parent
  while (current) {
    if (
      ts.isSourceFile(current)
      || ts.isBlock(current)
      || ts.isFunctionLike(current)
      || ts.isModuleBlock(current)
    ) return current
    current = current.parent
  }
  return node.getSourceFile()
}

function buildBindings(sourceFile) {
  const variables = new Map()
  const functions = new Map()

  function add(map, name, entry) {
    if (!map.has(name)) map.set(name, [])
    map.get(name).push(entry)
  }

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      add(variables, node.name.text, {
        node: node.initializer,
        position: node.pos,
        scope: lexicalScope(node)
      })
    } else if (ts.isFunctionDeclaration(node) && node.name && node.body) {
      add(functions, node.name.text, {
        node,
        position: node.pos,
        scope: lexicalScope(node)
      })
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return { variables, functions }
}

function closestBinding(entries, contextNode) {
  return (entries ?? [])
    .filter((entry) => entry.position < contextNode.pos && isAncestor(entry.scope, contextNode))
    .sort((left, right) => right.position - left.position)[0]
}

function immediateChildren(treeFiles, directory) {
  const prefix = `${directory.replace(/\/$/u, '')}/`
  return [...new Set(treeFiles
    .filter((file) => file.startsWith(prefix))
    .map((file) => file.slice(prefix.length).split('/')[0])
    .filter(Boolean))]
    .sort()
}

function findReturnExpression(node) {
  let found
  function visit(current) {
    if (found) return
    if (current !== node && ts.isFunctionLike(current)) return
    if (ts.isReturnStatement(current) && current.expression) {
      found = current.expression
      return
    }
    ts.forEachChild(current, visit)
  }
  visit(node)
  return found
}

function createStaticEvaluator({ sourceFile, file, treeFiles, bindings }) {
  const sourceDirectory = path.posix.dirname(file)
  const seen = new Set()

  function evaluate(node, contextNode = node) {
    const current = unwrap(node)
    if (!current) return undefined
    const literal = literalValue(current, sourceFile)
    if (literal !== undefined) return literal

    if (ts.isIdentifier(current)) {
      if (current.text === '__dirname') return sourceDirectory
      const binding = closestBinding(bindings.variables.get(current.text), contextNode)
      if (!binding) return undefined
      const key = `${current.text}:${binding.position}`
      if (seen.has(key)) return undefined
      seen.add(key)
      const value = evaluate(binding.node, current)
      seen.delete(key)
      return value
    }

    if (ts.isArrayLiteralExpression(current)) {
      const values = []
      for (const element of current.elements) {
        if (ts.isSpreadElement(element)) {
          const spread = evaluate(element.expression, element)
          if (!Array.isArray(spread)) return undefined
          values.push(...spread)
        } else {
          values.push(evaluate(element, element) ?? normalizeWhitespace(element.getText(sourceFile)))
        }
      }
      return values
    }

    if (ts.isObjectLiteralExpression(current)) {
      const value = {}
      for (const property of current.properties) {
        if (ts.isPropertyAssignment(property)) {
          value[propertyName(property.name, sourceFile)] = evaluate(property.initializer, property)
            ?? normalizeWhitespace(property.initializer.getText(sourceFile))
        }
      }
      return value
    }

    if (ts.isCallExpression(current)) {
      const callable = unwrap(current.expression)
      if (ts.isArrowFunction(callable) || ts.isFunctionExpression(callable)) {
        if (ts.isBlock(callable.body)) {
          const returned = findReturnExpression(callable.body)
          return returned ? evaluate(returned, current) : undefined
        }
        return evaluate(callable.body, current)
      }

      const expressionText = current.expression.getText(sourceFile)
      if (/^(?:path\.)?(?:join|resolve)$/u.test(expressionText)) {
        const parts = current.arguments.map((argumentNode) => evaluate(argumentNode, current))
        if (parts.some((part) => typeof part !== 'string')) return undefined
        return path.posix.normalize(path.posix.join(...parts))
      }
      if (/(?:^|\.)readdirSync$/u.test(expressionText)) {
        const directory = evaluate(current.arguments[0], current)
        return typeof directory === 'string' ? immediateChildren(treeFiles, directory) : undefined
      }
      if (/(?:^|\.)glob\.sync$/u.test(expressionText) || expressionText === 'glob.sync') {
        const patterns = evaluate(current.arguments[0], current)
        return resolveKnownGlobPatterns(patterns, treeFiles)
      }
      if (ts.isPropertyAccessExpression(current.expression)) {
        const operation = current.expression.name.text
        const receiver = evaluate(current.expression.expression, current)
        if (Array.isArray(receiver)) {
          if (operation === 'sort' || operation === 'filter' || operation === 'map') return receiver
          if (operation === 'slice') {
            const start = Number(evaluate(current.arguments[0], current) ?? 0)
            const endValue = current.arguments[1] ? evaluate(current.arguments[1], current) : undefined
            return receiver.slice(start, endValue === undefined ? undefined : Number(endValue))
          }
        }
      }
      if (ts.isIdentifier(current.expression)) {
        const binding = closestBinding(bindings.functions.get(current.expression.text), current)
        if (binding) {
          const returned = findReturnExpression(binding.node.body)
          return returned ? evaluate(returned, current) : undefined
        }
      }
    }

    return undefined
  }

  return evaluate
}

function resolveKnownGlobPatterns(patterns, treeFiles) {
  const values = Array.isArray(patterns) ? patterns : [patterns]
  const output = []
  for (const patternValue of values) {
    if (typeof patternValue !== 'string') continue
    if (patternValue.startsWith('examples/')) {
      output.push(...treeFiles.filter((file) => {
        if (!file.startsWith('examples/')) return false
        if (/\/index\.html$/u.test(file)) return true
        return /\/src\/.*\.(?:ts|tsx|html|vue|svelte|astro)$/u.test(file)
      }))
    } else if (patternValue.startsWith('site/app/')) {
      output.push(...treeFiles.filter((file) => /^site\/app\/\[locale\]\/.*\/content\.mdx$/u.test(file)))
    }
  }
  return [...new Set(output)].sort()
}

function testCallInfo(node, sourceFile) {
  if (!ts.isCallExpression(node)) return undefined
  let expression = node.expression
  let matrixExpression
  let modifiers = []

  if (ts.isCallExpression(expression)) {
    const inner = expression
    if (!ts.isPropertyAccessExpression(inner.expression) || inner.expression.name.text !== 'each') return undefined
    matrixExpression = inner.arguments[0]
    expression = inner.expression.expression
    modifiers.push('each')
  }

  const names = []
  let current = expression
  while (ts.isPropertyAccessExpression(current)) {
    names.unshift(current.name.text)
    current = current.expression
  }
  if (!ts.isIdentifier(current) || !['it', 'test'].includes(current.text)) return undefined
  names.unshift(current.text)
  modifiers = [...names.slice(1), ...modifiers]

  if (!matrixExpression && modifiers.includes('each')) return undefined
  if (ts.isCallExpression(node.parent) && node.parent.expression === node) return undefined

  return {
    matrixExpression,
    modifiers,
    titleNode: node.arguments[0],
    callback: node.arguments.find((argumentNode) => ts.isArrowFunction(argumentNode) || ts.isFunctionExpression(argumentNode))
  }
}

function describeCallInfo(node) {
  if (!ts.isCallExpression(node)) return undefined
  const expression = node.expression
  const text = expression.getText(node.getSourceFile())
  if (!/^(?:describe|suite)(?:\.(?:concurrent|only|skip))?$/u.test(text)) return undefined
  return {
    titleNode: node.arguments[0],
    callback: node.arguments.find((argumentNode) => ts.isArrowFunction(argumentNode) || ts.isFunctionExpression(argumentNode))
  }
}

function ruleTesterInfo(node, sourceFile) {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return undefined
  if (node.expression.name.text !== 'run' || node.arguments.length < 3) return undefined
  const configuration = unwrap(node.arguments[2])
  if (!configuration || !ts.isObjectLiteralExpression(configuration)) return undefined
  const groups = new Map()
  for (const property of configuration.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    const name = propertyName(property.name, sourceFile)
    if (name === 'valid' || name === 'invalid') groups.set(name, property.initializer)
  }
  if (!groups.size) return undefined
  return {
    groups,
    titleNode: node.arguments[0]
  }
}

function formatMatrixTitle(template, value, index) {
  const values = Array.isArray(value) ? value : [value]
  let cursor = 0
  const formatted = template.replace(/%[sdifjo]/gu, () => displayValue(values[cursor++]))
  if (formatted !== template) return formatted
  return `${template} [${index + 1}: ${displayValue(value)}]`
}

function classifyCase(testCase) {
  const packageName = testCase.package
  const haystack = `${testCase.file} ${testCase.suites.join(' ')} ${testCase.title}`.toLowerCase()
  const domains = new Set()

  if (['engine', 'facade', 'preset'].includes(packageName)) domains.add('css-bytes')
  if (['compiler', 'project', 'stylesheet'].includes(packageName)) {
    domains.add('authoring')
    domains.add('css-bytes')
  }
  if (['lexer', 'source', 'scanner', 'validator'].includes(packageName)) domains.add('syntax-extraction')
  if (['lint', 'eslint-plugin', 'eslint-config'].includes(packageName)) domains.add('lint-authoring')
  if (['language', 'language-service', 'language-server', 'vscode'].includes(packageName)) domains.add('language-authoring')
  if (packageName === 'runtime') {
    domains.add('runtime')
    domains.add('css-bytes')
  }
  if (packageName === 'server') {
    domains.add('server-rendering')
    domains.add('css-bytes')
  }
  if (['integration', 'vite', 'webpack', 'next', 'astro', 'nuxt', 'svelte'].includes(packageName)) {
    domains.add('integration')
    domains.add('rendering-modes')
  }
  if (/parser|syntax|selector|condition|class|utility|variable|keyframe|layer|priority|cascade/u.test(haystack)) {
    domains.add('syntax-css-semantics')
  }
  if (/theme|compose|variant|reference|directive|stylesheet|manifest/u.test(haystack)) {
    domains.add('authoring')
  }
  if (/runtime|static|progressive|pre-render|ssr|ssg|isr|hydration|fouc|hmr|preload/u.test(haystack)) {
    domains.add('rendering-modes')
  }
  if (!domains.size) domains.add('package-behavior')

  let priority = 'P2'
  if (corePackages.has(packageName)) {
    priority = 'P0'
  } else if (toolingPackages.has(packageName)) {
    priority = 'P1'
  }

  if (domains.has('rendering-modes') || domains.has('css-bytes')) priority = 'P0'
  return { domains: [...domains].sort(), priority }
}

function collectCasesFromRef(ref, commit) {
  const treeFiles = git(['ls-tree', '-r', '--name-only', commit]).trim().split('\n').filter(Boolean)
  const packageManifests = treeFiles.filter((file) => /^packages\/[^/]+\/package\.json$/u.test(file))
  const candidates = treeFiles.filter((file) => {
    if (!/^packages\/[^/]+\/(?:tests|e2e)\//u.test(file)) return false
    if (!sourceExtensions.test(file) || /\.d\.ts$/u.test(file) || /\.bench\./u.test(file)) return false
    return true
  })
  const cases = []
  const files = []
  let expandedMatrixCases = 0
  let dynamicMatrixCases = 0

  for (const file of candidates) {
    const source = git(['show', `${commit}:${file}`])
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    )
    const bindings = buildBindings(sourceFile)
    const evaluate = createStaticEvaluator({ sourceFile, file, treeFiles, bindings })
    const fileCases = []

    function evaluateWithEnvironment(node, environment) {
      const current = unwrap(node)
      if (current && ts.isIdentifier(current) && environment.has(current.text)) {
        return environment.get(current.text)
      }
      return evaluate(node, node)
    }

    function titleWithEnvironment(node, environment) {
      const value = evaluateWithEnvironment(node, environment)
      if (value !== undefined && (typeof value !== 'object' || value === null)) return String(value)
      return titleValue(node, sourceFile)
    }

    function bindIteration(name, value, environment) {
      const next = new Map(environment)
      if (ts.isIdentifier(name)) {
        next.set(name.text, value)
      } else if (ts.isObjectBindingPattern(name) && value && typeof value === 'object') {
        for (const element of name.elements) {
          if (!ts.isIdentifier(element.name)) continue
          const sourceName = element.propertyName
            ? propertyName(element.propertyName, sourceFile)
            : element.name.text
          next.set(element.name.text, value[sourceName])
        }
      } else if (ts.isArrayBindingPattern(name) && Array.isArray(value)) {
        name.elements.forEach((element, index) => {
          if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
            next.set(element.name.text, value[index])
          }
        })
      }
      return next
    }

    function addCase({ node, suites, title, runner, state = 'active', matrix, sourceKind = 'test' }) {
      if (
        (file === 'packages/css/tests/engine/rust-engine.test.ts'
          && title === 'executes the semantic engine corpus through native and Wasm sessions')
        || (file === 'packages/compiler/tests/session.test.ts'
          && title === 'native and Wasm compiler sessions execute the semantic compiler corpus')
      ) return
      const packageName = packageOf(file)
      const sourceText = normalizeWhitespace(node.getText(sourceFile))
      const testCase = {
        id: `rc87-${shortDigest(`${file}\0${suites.join('\0')}\0${title}\0${runner}\0${matrix?.index ?? ''}\0${sourceKind}`)}`,
        package: packageName,
        file,
        line: lineOf(sourceFile, node),
        suites,
        title,
        runner,
        kind: /\/e2e\/|[-.]e2e\./u.test(file) ? 'e2e' : 'test',
        state,
        sourceKind,
        sourceDigest: sha256(sourceText),
        matrix
      }
      Object.assign(testCase, classifyCase(testCase))
      fileCases.push(testCase)
      cases.push(testCase)
    }

    function addRuleTesterCases(node, info, suites) {
      const runTitle = titleValue(info.titleNode, sourceFile)
      for (const [group, initializer] of info.groups) {
        const values = evaluate(initializer, initializer)
        if (!Array.isArray(values)) {
          dynamicMatrixCases++
          addCase({
            node,
            suites: [...suites, runTitle, group],
            title: `${runTitle} / ${group} [dynamic]`,
            runner: 'eslint-rule-tester',
            sourceKind: 'rule-tester',
            matrix: { index: 0, resolved: false, value: '<dynamic>' }
          })
          continue
        }
        values.forEach((value, index) => {
          expandedMatrixCases++
          addCase({
            node,
            suites: [...suites, runTitle, group],
            title: `${runTitle} / ${group}[${index + 1}] / ${displayValue(value)}`,
            runner: 'eslint-rule-tester',
            sourceKind: 'rule-tester',
            matrix: { index, resolved: true, value: displayValue(value) }
          })
        })
      }
    }

    function walk(node, suites = [], environment = new Map()) {
      if (ts.isForOfStatement(node)) {
        const values = evaluateWithEnvironment(node.expression, environment)
        const declaration = ts.isVariableDeclarationList(node.initializer)
          ? node.initializer.declarations[0]
          : undefined
        if (Array.isArray(values) && declaration) {
          for (const value of values) {
            walk(node.statement, suites, bindIteration(declaration.name, value, environment))
          }
          return
        }
      }

      if (ts.isCallExpression(node)) {
        const describeInfo = describeCallInfo(node)
        if (describeInfo?.callback) {
          const suiteTitle = titleWithEnvironment(describeInfo.titleNode, environment)
          walk(describeInfo.callback.body, [...suites, suiteTitle], environment)
          return
        }

        const ruleInfo = ruleTesterInfo(node, sourceFile)
        if (ruleInfo) {
          addRuleTesterCases(node, ruleInfo, suites)
          return
        }

        const testInfo = testCallInfo(node, sourceFile)
        if (testInfo) {
          const template = titleWithEnvironment(testInfo.titleNode, environment)
          const state = testInfo.modifiers.includes('todo')
            ? 'todo'
            : testInfo.modifiers.includes('skip')
              ? 'skip'
              : testInfo.modifiers.includes('only')
                ? 'only'
                : 'active'
          const runner = /\/e2e\//u.test(file) ? 'playwright-or-vitest-e2e' : 'vitest'
          if (testInfo.matrixExpression) {
            const values = evaluateWithEnvironment(testInfo.matrixExpression, environment)
            if (Array.isArray(values) && values.length) {
              values.forEach((value, index) => {
                expandedMatrixCases++
                addCase({
                  node,
                  suites,
                  title: formatMatrixTitle(template, value, index),
                  runner,
                  state,
                  matrix: { index, resolved: true, value: displayValue(value) }
                })
              })
            } else {
              dynamicMatrixCases++
              addCase({
                node,
                suites,
                title: `${template} [dynamic]`,
                runner,
                state,
                matrix: { index: 0, resolved: false, value: '<dynamic>' }
              })
            }
          } else {
            addCase({ node, suites, title: template, runner, state })
          }
          return
        }
      }
      ts.forEachChild(node, (child) => walk(child, suites, environment))
    }

    walk(sourceFile)
    if (!fileCases.length && /\.(?:test|spec)\.(?:c|m)?(?:j|t)sx?$/u.test(file)) {
      addCase({
        node: sourceFile,
        suites: [],
        title: 'module evaluation / compile-only smoke',
        runner: 'vitest',
        sourceKind: 'module-smoke'
      })
    }
    if (fileCases.length) {
      files.push({
        file,
        package: packageOf(file),
        kind: fileCases.some((testCase) => testCase.kind === 'e2e') ? 'e2e' : 'test',
        cases: fileCases.length,
        digest: sha256(source)
      })
    }
  }

  return {
    ref,
    commit,
    packageCount: packageManifests.length,
    files: files.sort((left, right) => left.file.localeCompare(right.file)),
    cases: cases.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line || left.title.localeCompare(right.title)),
    expandedMatrixCases,
    dynamicMatrixCases
  }
}

function collectSemanticCorpusCases(commit) {
  const file = 'parity/rust-semantic-corpus.json'
  const source = git(['show', `${commit}:${file}`])
  const corpus = JSON.parse(source)
  assert.equal(corpus.version, 2, 'Unsupported Rust semantic corpus version.')

  const cases = []
  const addCases = (collection, packageName, suite, runner) => {
    for (const parityCase of collection) {
      if (!parityCase.sourceId) continue
      const marker = `"id": "${parityCase.id}"`
      const offset = source.indexOf(marker)
      assert.notEqual(offset, -1, `Cannot locate semantic corpus case ${parityCase.id}.`)
      cases.push({
        id: `rc87-${shortDigest(`${file}\0${suite}\0${parityCase.id}\0${runner}`)}`,
        package: parityCase.targetPackage ?? packageName,
        file,
        line: source.slice(0, offset).split('\n').length,
        suites: ['rc.87 semantic corpus', suite],
        title: parityCase.id,
        runner: parityCase.runner ?? runner,
        kind: 'test',
        state: 'active',
        sourceKind: 'corpus',
        sourceDigest: sha256(JSON.stringify(parityCase)),
        matrix: undefined,
        domains: (parityCase.targetPackage ?? packageName) === 'compiler'
          ? ['authoring', 'css-bytes']
          : ['css-bytes', 'syntax-css-semantics'],
        priority: 'P0'
      })
    }
  }

  addCases(corpus.parserCases ?? [], 'css', 'parser', 'cargo-test')
  addCases(corpus.engineCases ?? [], 'css', 'engine', 'cargo-xtask+vitest-native-wasm')
  addCases(corpus.compilerCases ?? [], 'compiler', 'compiler', 'cargo-xtask+vitest-native-wasm')
  return cases
}

function collectRustTakeoverCases(commit) {
  const file = 'parity/rust-takeover-ledger.json'
  const source = git(['show', `${commit}:${file}`])
  const ledger = JSON.parse(source)
  assert.equal(ledger.version, 1, 'Unsupported Rust takeover ledger version.')

  const cases = []
  for (const suite of ledger.suites) {
    assert.equal(
      suite.tests.length,
      suite.expectedTests,
      `Rust takeover suite ${suite.file} has a stale test count.`
    )
    for (const takeoverCase of suite.tests) {
      const marker = `"name": "${takeoverCase.name.replaceAll('"', '\\"')}"`
      const offset = source.indexOf(marker)
      assert.notEqual(offset, -1, `Cannot locate Rust takeover case ${suite.file}#${takeoverCase.name}.`)
      cases.push({
        id: `rc87-${shortDigest(`${file}\0${suite.file}\0${takeoverCase.name}\0cargo-xtask`)}`,
        package: 'css',
        file,
        line: source.slice(0, offset).split('\n').length,
        suites: ['rc.87 Rust takeover audit', suite.file],
        title: takeoverCase.name,
        runner: 'cargo-xtask',
        kind: 'test',
        state: 'active',
        sourceKind: 'takeover-audit',
        sourceDigest: sha256(JSON.stringify({ suite: suite.file, ...takeoverCase })),
        matrix: undefined,
        domains: ['css-bytes', 'syntax-css-semantics'],
        priority: 'P0',
        takeoverSourceFile: suite.file
      })
    }
  }
  assert.equal(cases.length, ledger.expectedLegacyTests, 'Rust takeover audit count drifted.')
  return cases
}

function loadTakeoverEvidence() {
  const ledger = JSON.parse(readFileSync(path.resolve('parity/rust-takeover-ledger.json'), 'utf8'))
  const evidence = new Map()
  for (const suite of ledger.suites) {
    for (const test of suite.tests) {
      evidence.set(`${suite.file}\0${normalizeTitle(test.name)}`, test.coverage)
    }
  }
  return {
    evidence,
    expectedLegacyTests: ledger.expectedLegacyTests,
    semanticBaseline: ledger.semanticBaseline,
    suites: ledger.suites.length
  }
}

function assertObjectKeys(value, allowedKeys, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object.`)
  const unknownKeys = Object.keys(value).filter((key) => !allowedKeys.includes(key))
  assert.deepEqual(unknownKeys, [], `${label} has unsupported keys.`)
}

function loadMigrationEvidence() {
  assert.ok(existsSync(evidencePath), `${path.relative(process.cwd(), evidencePath)} does not exist.`)
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  assertObjectKeys(evidence, ['$schema', 'version', 'baseline', 'records'], 'Migration evidence')
  assert.equal(evidence.version, 1, 'Unsupported test migration evidence version.')
  assertObjectKeys(evidence.baseline, ['ref', 'commit'], 'Migration evidence baseline')
  assert.deepEqual(evidence.baseline, {
    ref: DEFAULT_BASELINE_REF,
    commit: RC87_COMMIT
  }, 'Migration evidence must remain rooted at v2.0.0-rc.87.')
  assert.ok(Array.isArray(evidence.records), 'Migration evidence records must be an array.')
  assert.equal(
    new Set(evidence.records.map((record) => record.sourceId)).size,
    evidence.records.length,
    'Migration evidence source ids must be unique.'
  )
  for (const record of evidence.records) {
    assertObjectKeys(record, ['sourceId', 'sourceDigest', 'proof', 'targets', 'exceptionId'], `Migration evidence ${record.sourceId ?? '<unknown>'}`)
    assert.match(record.sourceId, /^rc87-[a-f0-9]{16}$/u, 'Invalid migration evidence source id.')
    assert.match(record.sourceDigest, /^[a-f0-9]{64}$/u, `Invalid source digest for ${record.sourceId}.`)
    assert.ok(Array.isArray(record.targets), `Migration evidence targets must be an array for ${record.sourceId}.`)
    for (const target of record.targets) {
      assertObjectKeys(target, ['caseId', 'runner', 'digest'], `Migration evidence target for ${record.sourceId}`)
      assert.match(target.caseId, /^rc87-[a-f0-9]{16}$/u, `Invalid target case id for ${record.sourceId}.`)
      assert.equal(typeof target.runner, 'string', `Invalid target runner for ${record.sourceId}/${target.caseId}.`)
      assert.match(target.digest, /^[a-f0-9]{64}$/u, `Invalid target digest for ${record.sourceId}/${target.caseId}.`)
    }
  }
  return evidence
}

function seedSemanticCoreEvidence(legacyInventory, targetInventory) {
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  const legacyById = new Map(legacyInventory.cases.map((testCase) => [testCase.id, testCase]))
  const targetById = new Map(targetInventory.cases.map((testCase) => [testCase.id, testCase]))
  const recordsBySourceId = new Map(evidence.records.map((record) => [record.sourceId, record]))

  const add = (sourceId, targetId, proof = 'rc87-golden', exceptionId) => {
    const source = legacyById.get(sourceId)
    const target = targetById.get(targetId)
    assert.ok(source, `Cannot seed evidence for unknown rc.87 source ${sourceId}.`)
    assert.ok(target, `Cannot seed evidence from unknown target ${targetId}.`)
    const record = {
      sourceId,
      sourceDigest: source.sourceDigest,
      proof,
      targets: [proofTargetReference(target)],
      ...(exceptionId ? { exceptionId } : {})
    }
    recordsBySourceId.set(sourceId, record)
  }

  const corpus = JSON.parse(git(['show', `${targetInventory.commit}:parity/rust-semantic-corpus.json`]))
  const corpusCases = [
    ...(corpus.parserCases ?? []),
    ...(corpus.engineCases ?? []),
    ...(corpus.compilerCases ?? [])
  ]
  for (const target of targetInventory.cases.filter((testCase) => testCase.sourceKind === 'corpus')) {
    const marker = target.title.match(/^rc87-(?:rule|condition|selector)-([a-f0-9]{16})$/u)
    const corpusCase = corpusCases.find((parityCase) => parityCase.id === target.title)
    const sourceId = corpusCase?.sourceId ?? (marker ? `rc87-${marker[1]}` : undefined)
    assert.ok(sourceId, `Semantic corpus target ${target.id} is missing a source id.`)
    add(sourceId, target.id)
  }

  for (const source of legacyInventory.cases.filter((testCase) => testCase.package === 'preset')) {
    const target = targetById.get(source.id)
    assert.ok(target, `Preset target ${source.id} does not exist.`)
    if (target.sourceDigest !== source.sourceDigest) add(source.id, target.id)
  }

  for (const [sourceId, targetId] of Object.entries({
    'rc87-b11746c9f1518fb7': 'rc87-b11746c9f1518fb7',
    'rc87-4df86b020ce4b8b0': 'rc87-169aa2084c530524',
    'rc87-5addd7a449a39251': 'rc87-1ce84bf138cf2c12',
    'rc87-92453f4235a0cfe7': 'rc87-c8e38b5882938dae',
    'rc87-1314e9fb5567b923': 'rc87-c80932d3a9a18c74'
  })) add(sourceId, targetId)

  add(
    'rc87-e20922b4178a8548',
    'rc87-bee4d1e5c45c7230',
    'approved-divergence',
    'rc87-stylesheet-explicit-preset-input'
  )
  add(
    'rc87-fb2f146924e1ad8d',
    'rc87-1f6ba6afdba0cb65',
    'approved-divergence',
    'rc87-facade-async-rust-engine'
  )

  evidence.records = [...recordsBySourceId.values()]
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId))
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
}

function seedRenderingEvidence(legacyInventory, targetInventory) {
  assert.equal(
    targetInventory.commit,
    RC87_RENDERING_TARGET_COMMIT,
    'Rendering evidence must be audited against the pinned milestone 2 target.'
  )
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  const legacyById = new Map(legacyInventory.cases.map((testCase) => [testCase.id, testCase]))
  const targetById = new Map(targetInventory.cases.map((testCase) => [testCase.id, testCase]))
  const recordsBySourceId = new Map(evidence.records.map((record) => [record.sourceId, record]))

  for (const [sourceId, targetId] of Object.entries({
    'rc87-e5e959ce815f4075': 'rc87-afcc9d12f3e25e40',
    'rc87-3acbadf9896a963e': 'rc87-f850677b1ac88e1f',
    'rc87-7972b1e44a0ef1b0': 'rc87-7972b1e44a0ef1b0',
    'rc87-728a7d9729298578': 'rc87-97ab7b679d64361a',
    'rc87-57602588c78ae709': 'rc87-bb70569b1ed54bb8',
    'rc87-795623b483f38e22': 'rc87-39a77796e0b1f824',
    'rc87-fe7a516491c038f9': 'rc87-b005654530dfa559',
    'rc87-e2132de21c68b007': 'rc87-72e45c26e6cbfd8b',
    'rc87-47fa115a9538f8d2': 'rc87-f92062b7788b8b27',
    'rc87-70c2e3c4a256b439': 'rc87-c7c1de220cf317cb',
    'rc87-0a260cfed5ff47f3': 'rc87-7b9e66b4d7c60243',
    'rc87-8f7a7d12d1d84faa': 'rc87-b0218b93c7b226b7',
    'rc87-4810e1434426c157': 'rc87-3870cf70bffbc204',
    'rc87-b15b04cb5918ded5': 'rc87-4209a04423ae00dc',
    'rc87-a7c3d85a8ea0f2a5': 'rc87-5b9cf5b8ce504959',
    'rc87-2e2293bca9545a5d': 'rc87-083f0c80af0348a1',
    'rc87-444fa61e3043ad5a': 'rc87-a68de8240d5d5ab1',
    'rc87-a56511bb87340647': 'rc87-2374f8fb8b086ebb',
    'rc87-8fdccb91ecc7d385': 'rc87-5ac35fa4acb8eccb',
    'rc87-8896fbca801ba254': 'rc87-2efcdbec736de191',
    'rc87-79f6c5b29444c7c2': 'rc87-40741f3f92fa5de7',
    'rc87-d14914b2ce83eea4': 'rc87-5732d85f2647b215',
    'rc87-adc2c0320de1390a': 'rc87-ea9b5d2ffe198b2f',
    'rc87-445f7d5e699d5a2a': 'rc87-b3e92ac7d4b8a66d',
    'rc87-0c1a66389510440f': 'rc87-609e3c42e72dd6d3'
  })) {
    const source = legacyById.get(sourceId)
    const target = targetById.get(targetId)
    assert.ok(source, `Cannot seed rendering evidence for unknown rc.87 source ${sourceId}.`)
    assert.ok(target, `Cannot seed rendering evidence from unknown target ${targetId}.`)
    recordsBySourceId.set(sourceId, {
      sourceId,
      sourceDigest: source.sourceDigest,
      proof: 'rc87-golden',
      targets: [proofTargetReference(target)]
    })
  }

  // These candidates were reviewed file-by-file and executed through their owner
  // package suites; runtime additionally passed the complete 231-case browser matrix.
  const auditedPackages = new Set([
    'astro',
    'next',
    'runtime',
    'server',
    'svelte',
    'vite',
    'webpack'
  ])
  const currentLedger = JSON.parse(readFileSync(ledgerPath, 'utf8'))
  assert.equal(
    currentLedger.target.commit,
    RC87_RENDERING_TARGET_COMMIT,
    'The current ledger does not describe the pinned milestone 2 target.'
  )
  for (const entry of currentLedger.entries) {
    if (
      !auditedPackages.has(entry.source.package)
      || entry.migration.status !== 'mapped-unverified'
    ) continue
    assert.equal(entry.priority, 'P0', `Unexpected non-P0 rendering case ${entry.id}.`)
    assert.equal(entry.migration.targets.length, 1, `Rendering evidence target is ambiguous for ${entry.id}.`)
    const source = legacyById.get(entry.id)
    const target = targetById.get(entry.migration.targets[0].id)
    assert.ok(source, `Cannot seed audited rendering source ${entry.id}.`)
    assert.ok(target, `Cannot seed audited rendering target for ${entry.id}.`)
    recordsBySourceId.set(entry.id, {
      sourceId: entry.id,
      sourceDigest: source.sourceDigest,
      proof: 'rc87-golden',
      targets: [proofTargetReference(target)]
    })
  }

  evidence.records = [...recordsBySourceId.values()]
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId))
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
}

function seedAuthoringEvidence(legacyInventory, targetInventory) {
  assert.equal(
    targetInventory.commit,
    RC87_AUTHORING_TARGET_COMMIT,
    'Authoring evidence must be audited against the pinned milestone 3 target.'
  )
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
  const legacyById = new Map(legacyInventory.cases.map((testCase) => [testCase.id, testCase]))
  const targetById = new Map(targetInventory.cases.map((testCase) => [testCase.id, testCase]))
  const recordsBySourceId = new Map(evidence.records.map((record) => [record.sourceId, record]))
  const currentLedger = JSON.parse(readFileSync(ledgerPath, 'utf8'))
  assert.equal(
    currentLedger.target.commit,
    RC87_AUTHORING_TARGET_COMMIT,
    'The current ledger does not describe the pinned milestone 3 target.'
  )

  for (const entry of currentLedger.entries) {
    if (entry.priority !== 'P0' || entry.migration.status !== 'mapped-unverified') continue
    assert.equal(entry.migration.targets.length, 1, `P0 evidence target is ambiguous for ${entry.id}.`)
    const source = legacyById.get(entry.id)
    const target = targetById.get(entry.migration.targets[0].id)
    assert.ok(source, `Cannot seed audited P0 source ${entry.id}.`)
    assert.ok(target, `Cannot seed audited P0 target for ${entry.id}.`)
    recordsBySourceId.set(entry.id, {
      sourceId: entry.id,
      sourceDigest: source.sourceDigest,
      proof: 'rc87-golden',
      targets: [proofTargetReference(target)]
    })
  }

  evidence.records = [...recordsBySourceId.values()]
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId))
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
}

function loadParityExceptions() {
  const registry = JSON.parse(readFileSync(exceptionsPath, 'utf8'))
  assert.ok(Array.isArray(registry.exceptions), 'Parity exceptions must be an array.')
  assert.equal(
    new Set(registry.exceptions.map((exception) => exception.id)).size,
    registry.exceptions.length,
    'Parity exception ids must be unique.'
  )
  return new Map(registry.exceptions.map((exception) => [exception.id, exception]))
}

function targetOwner(packageName, sourceId, sourceFile) {
  if (
    packageName === 'language'
    && /\/tests\/(?:browser|shiki|get-class-position\/)/u.test(sourceFile)
  ) return 'language-service'
  return legacyCaseOwnerMap.get(sourceId) ?? legacyOwnerMap.get(packageName) ?? packageName
}

function targetReference(testCase) {
  return {
    id: testCase.id,
    package: testCase.package,
    file: testCase.file,
    line: testCase.line,
    title: testCase.title,
    runner: testCase.runner,
    kind: testCase.kind,
    sourceDigest: testCase.sourceDigest,
    matrix: testCase.matrix
  }
}

function proofTargetReference(testCase) {
  return {
    caseId: testCase.id,
    runner: testCase.runner,
    digest: testCase.sourceDigest
  }
}

function validateEvidenceRecord(record, legacyCase, targetById, exceptions) {
  assert.equal(record.sourceDigest, legacyCase.sourceDigest, `Stale rc.87 source digest for ${record.sourceId}.`)
  assert.ok(
    ['exact-source', 'rc87-golden', 'approved-divergence'].includes(record.proof),
    `Unsupported proof kind for ${record.sourceId}.`
  )
  assert.ok(Array.isArray(record.targets) && record.targets.length, `Evidence targets are required for ${record.sourceId}.`)
  assert.equal(
    new Set(record.targets.map((target) => target.caseId)).size,
    record.targets.length,
    `Evidence targets must be unique for ${record.sourceId}.`
  )

  const targets = record.targets.map((reference) => {
    const target = targetById.get(reference.caseId)
    assert.ok(target, `Evidence target ${reference.caseId} for ${record.sourceId} does not exist.`)
    assert.equal(reference.runner, target.runner, `Stale target runner for ${record.sourceId}/${reference.caseId}.`)
    assert.equal(reference.digest, target.sourceDigest, `Stale target digest for ${record.sourceId}/${reference.caseId}.`)
    assert.equal(target.package, targetOwner(legacyCase.package, legacyCase.id, legacyCase.file), `Evidence target owner mismatch for ${record.sourceId}/${reference.caseId}.`)
    return target
  })

  if (record.proof === 'exact-source') {
    assert.equal(targets.length, 1, `Exact-source evidence requires one target for ${record.sourceId}.`)
    assert.equal(targets[0].sourceDigest, legacyCase.sourceDigest, `Exact-source digest mismatch for ${record.sourceId}.`)
    assert.equal(record.exceptionId, undefined, `Exact-source evidence cannot reference an exception for ${record.sourceId}.`)
  } else if (record.proof === 'rc87-golden') {
    assert.equal(record.exceptionId, undefined, `rc87-golden evidence cannot reference an exception for ${record.sourceId}.`)
  } else {
    assert.equal(typeof record.exceptionId, 'string', `Approved divergence requires an exception id for ${record.sourceId}.`)
    assert.ok(exceptions.has(record.exceptionId), `Unknown parity exception ${record.exceptionId} for ${record.sourceId}.`)
  }

  return targets
}

function mapCases(legacyInventory, targetInventory, takeover, migrationEvidence, exceptions) {
  const targetByPackageAndExactTitle = new Map()
  const targetByPackageAndExactFullTitle = new Map()
  const targetByPackageAndTitle = new Map()
  const targetByPackageAndFullTitle = new Map()
  const targetById = new Map(targetInventory.cases.map((testCase) => [testCase.id, testCase]))
  const legacyById = new Map(legacyInventory.cases.map((testCase) => [testCase.id, testCase]))
  const evidenceBySourceId = new Map(migrationEvidence.records.map((record) => [record.sourceId, record]))

  for (const record of migrationEvidence.records) {
    assert.ok(legacyById.has(record.sourceId), `Migration evidence references unknown source ${record.sourceId}.`)
  }

  for (const targetCase of targetInventory.cases) {
    const exactTitleKey = `${targetCase.package}\0${exactTitle(targetCase.title)}`
    const exactFullKey = `${targetCase.package}\0${exactTitle([...targetCase.suites, targetCase.title].join(' > '))}`
    const titleKey = `${targetCase.package}\0${normalizeTitle(targetCase.title)}`
    const fullKey = `${targetCase.package}\0${normalizeTitle([...targetCase.suites, targetCase.title].join(' > '))}`
    if (!targetByPackageAndExactTitle.has(exactTitleKey)) targetByPackageAndExactTitle.set(exactTitleKey, [])
    if (!targetByPackageAndExactFullTitle.has(exactFullKey)) targetByPackageAndExactFullTitle.set(exactFullKey, [])
    if (!targetByPackageAndTitle.has(titleKey)) targetByPackageAndTitle.set(titleKey, [])
    if (!targetByPackageAndFullTitle.has(fullKey)) targetByPackageAndFullTitle.set(fullKey, [])
    targetByPackageAndExactTitle.get(exactTitleKey).push(targetCase)
    targetByPackageAndExactFullTitle.get(exactFullKey).push(targetCase)
    targetByPackageAndTitle.get(titleKey).push(targetCase)
    targetByPackageAndFullTitle.get(fullKey).push(targetCase)
  }

  const mappedTargetIds = new Set()
  const entries = legacyInventory.cases.map((legacyCase) => {
    const owner = targetOwner(legacyCase.package, legacyCase.id, legacyCase.file)
    const exactFullTitle = exactTitle([...legacyCase.suites, legacyCase.title].join(' > '))
    const exactCaseTitle = exactTitle(legacyCase.title)
    const fullTitle = normalizeTitle([...legacyCase.suites, legacyCase.title].join(' > '))
    const title = normalizeTitle(legacyCase.title)
    let candidates = targetByPackageAndExactFullTitle.get(`${owner}\0${exactFullTitle}`) ?? []
    if (!candidates.length) candidates = targetByPackageAndExactTitle.get(`${owner}\0${exactCaseTitle}`) ?? []
    if (!candidates.length) candidates = targetByPackageAndFullTitle.get(`${owner}\0${fullTitle}`) ?? []
    if (!candidates.length) candidates = targetByPackageAndTitle.get(`${owner}\0${title}`) ?? []

    if (candidates.length > 1) {
      const sameFile = candidates.filter((candidate) => candidate.file === legacyCase.file)
      if (sameFile.length) candidates = sameFile
    }
    if (candidates.length > 1) {
      const basename = path.posix.basename(legacyCase.file)
      const sameBasename = candidates.filter((candidate) => path.posix.basename(candidate.file) === basename)
      if (sameBasename.length) candidates = sameBasename
    }

    const takeoverCoverage = takeover.evidence.get(`${legacyCase.file}\0${title}`) ?? []
    const identicalTargets = candidates
      .filter((target) => target.sourceDigest === legacyCase.sourceDigest)
      .map((target) => target.id)
    const evidenceRecord = evidenceBySourceId.get(legacyCase.id)
    const evidenceTargets = evidenceRecord
      ? validateEvidenceRecord(evidenceRecord, legacyCase, targetById, exceptions)
      : []
    const exactSourceTarget = !evidenceRecord && identicalTargets.length === 1
      ? targetById.get(identicalTargets[0])
      : undefined
    const selectedTargets = evidenceTargets.length
      ? evidenceTargets
      : exactSourceTarget
        ? [exactSourceTarget]
        : candidates
    const targets = selectedTargets.map(targetReference)
    for (const target of selectedTargets) mappedTargetIds.add(target.id)

    let status = 'gap'
    let coverage = targets.length === 1 || takeoverCoverage.length ? 'candidate-all' : targets.length > 1 ? 'ambiguous' : 'none'
    let proof = null
    let divergence = null
    if (legacyCase.state === 'todo' || legacyCase.state === 'skip') {
      assert.equal(evidenceRecord, undefined, `Source-inactive case ${legacyCase.id} cannot carry migration evidence.`)
      status = 'source-inactive'
    } else if (evidenceRecord) {
      status = evidenceRecord.proof === 'approved-divergence' ? 'approved-divergence' : 'verified-exact'
      coverage = 'evidence'
      proof = {
        kind: evidenceRecord.proof,
        sourceDigest: evidenceRecord.sourceDigest,
        targets: evidenceRecord.targets,
        exceptionId: evidenceRecord.exceptionId
      }
      if (evidenceRecord.proof === 'approved-divergence') divergence = exceptions.get(evidenceRecord.exceptionId)
    } else if (exactSourceTarget) {
      status = 'verified-exact'
      coverage = 'exact-source'
      proof = {
        kind: 'exact-source',
        sourceDigest: legacyCase.sourceDigest,
        targets: [proofTargetReference(exactSourceTarget)]
      }
    } else if (targets.length || takeoverCoverage.length) {
      status = 'mapped-unverified'
    }

    return {
      id: legacyCase.id,
      priority: legacyCase.priority,
      domains: legacyCase.domains,
      source: {
        package: legacyCase.package,
        file: legacyCase.file,
        line: legacyCase.line,
        suites: legacyCase.suites,
        title: legacyCase.title,
        runner: legacyCase.runner,
        kind: legacyCase.kind,
        state: legacyCase.state,
        sourceKind: legacyCase.sourceKind,
        sourceDigest: legacyCase.sourceDigest,
        matrix: legacyCase.matrix
      },
      ownership: {
        targetPackage: owner
      },
      migration: {
        status,
        coverage,
        targets,
        sourceIdenticalTargetIds: identicalTargets,
        takeoverCoverage,
        proof
      },
      divergence
    }
  })

  const targetOnly = targetInventory.cases
    .filter((testCase) => testCase.sourceKind !== 'takeover-audit' && !mappedTargetIds.has(testCase.id))
    .map(targetReference)

  return { entries, targetOnly }
}

function countBy(values, getKey) {
  const counts = {}
  for (const value of values) {
    const key = getKey(value)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)))
}

function buildPostBaselineOverlay(baselineCommit, preferredRef) {
  const ref = hasRef(preferredRef) ? preferredRef : 'rc'
  if (!hasRef(ref)) return null
  const commit = resolveRef(ref)
  if (commit === baselineCommit) return { ref, commit, files: [], commits: [] }
  const changes = git(['diff', '--name-status', `${baselineCommit}..${commit}`, '--', 'packages'])
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [gitStatus, ...paths] = line.split('\t')
      const file = paths.at(-1)
      const manifestLoader = /manifest-(?:facade|loader|virtual-module)|css-manifest-loader/u.test(file)
        || file === 'packages/integration/tests/module.test.ts'
        || file === 'packages/webpack/tests/plugin.test.ts'
      return {
        file,
        gitStatus,
        priority: manifestLoader ? 'P0' : 'P2',
        decision: manifestLoader ? 'pending-decision' : 'outside-semantic-parity',
        behavior: manifestLoader
          ? 'Post-rc.87 browser manifest loading compatibility change; adoption requires an explicit rc.87 divergence decision.'
          : 'Post-rc.87 package metadata or peripheral change.'
      }
    })
  const commits = git(['log', '--format=%H%x09%s', `${baselineCommit}..${commit}`, '--', 'packages'])
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, ...summary] = line.split('\t')
      return { commit: hash, summary: summary.join('\t') }
    })
  return { ref, commit, files: changes, commits }
}

function buildReport(ledger) {
  const gaps = ledger.entries.filter((entry) => entry.migration.status === 'gap')
  const p0Gaps = gaps.filter((entry) => entry.priority === 'P0')
  const active = ledger.entries.filter((entry) => entry.source.state === 'active' || entry.source.state === 'only')
  const complete = active.filter((entry) => ['verified-exact', 'approved-divergence'].includes(entry.migration.status))
  const unresolvedMatrices = ledger.entries.filter((entry) => entry.source.matrix?.resolved === false)
  const packageRows = Object.entries(ledger.summary.byPackage)
    .map(([packageName, counts]) => `| \`${packageName}\` | ${counts.total} | ${counts.P0 ?? 0} | ${counts.P1 ?? 0} | ${counts.P2 ?? 0} | ${counts.mapped ?? 0} | ${counts.gap ?? 0} |`)
    .join('\n')
  const p0GapRows = p0Gaps.slice(0, 80)
    .map((entry) => `| \`${entry.source.file}:${entry.source.line}\` | ${entry.source.title.replace(/\|/gu, '\\|')} | ${entry.domains.join(', ')} |`)
    .join('\n') || '| — | None | — |'
  const overlayRows = (ledger.postBaselineOverlay?.files ?? [])
    .map((entry) => `| ${entry.priority} | \`${entry.file}\` | ${entry.decision} | ${entry.behavior} |`)
    .join('\n') || '| — | None | — | — |'

  return `# Rust test migration from v2.0.0-rc.87

This report is generated by \`node scripts/build-ts-test-migration-ledger.mjs\`.
The machine-readable source of truth is \`parity/ts-test-migration-ledger.json\`.

## Frozen baseline

- Public and semantic source baseline: \`${ledger.baseline.ref}@${ledger.baseline.commit}\`.
- Rust target candidate: \`${ledger.target.ref}@${ledger.target.commit}\`.
- Scope: executable tests and E2E cases under \`packages/*\`; examples, site, and benchmarks are not migration denominators.
- Newer rc changes are an overlay only and never replace rc.87 expectations.

## Inventory

| Measure | Count |
|---|---:|
| rc.87 workspace packages | ${ledger.baseline.packageCount} |
| rc.87 executable test files | ${ledger.baseline.testFiles} |
| rc.87 executable E2E files | ${ledger.baseline.e2eFiles} |
| rc.87 expanded cases | ${ledger.baseline.cases} |
| Expanded parameter and RuleTester cases | ${ledger.baseline.expandedMatrixCases} |
| Unresolved runtime matrices | ${ledger.baseline.dynamicMatrixCases} |
| Rust target cases collected | ${ledger.target.cases} |
| Target-only cases | ${ledger.summary.targetOnlyCases} |

The old 114-test takeover ledger is an engine-only historical subset. Its semantic
capture commit \`${ledger.existingParity.semanticBaseline}\` is not substituted for rc.87.

## Migration status

| Status | Count |
|---|---:|
${Object.entries(ledger.summary.byStatus).map(([status, count]) => `| ${status} | ${count} |`).join('\n')}

| Candidate coverage | Count |
|---|---:|
${Object.entries(ledger.summary.byCoverage).map(([coverage, count]) => `| ${coverage} | ${count} |`).join('\n')}

| Verification proof | Count |
|---|---:|
${Object.entries(ledger.summary.byProof).map(([proof, count]) => `| ${proof} | ${count} |`).join('\n') || '| — | 0 |'}

| Priority | Cases | Gaps |
|---|---:|---:|
${['P0', 'P1', 'P2', 'P3'].map((priority) => `| ${priority} | ${ledger.summary.byPriority[priority] ?? 0} | ${ledger.entries.filter((entry) => entry.priority === priority && entry.migration.status === 'gap').length} |`).join('\n')}
Verified active cases: ${complete.length}/${active.length}.

\`mapped-unverified\` means that an executable target candidate or takeover reference
exists. It does not claim parity. \`exact-source\` requires one identical executable
target; \`rc87-golden\` requires an explicit evidence record with pinned target digests.
Ambiguous candidates remain incomplete until evidence selects a target explicitly.

## Package ledger

| Legacy package | Cases | P0 | P1 | P2 | Mapped/inactive | Gaps |
|---|---:|---:|---:|---:|---:|---:|
${packageRows}

## P0 behavior gates

- Exact CSS bytes: selector escaping, declaration and cascade ordering, fixed layer order, variables, resources, and keyframes outside layers.
- Syntax: parser boundaries, values, functions, groups, priority, modes, selectors, conditions, invalid and retired syntax.
- Authoring: \`@theme\`, \`@custom-variant\`, \`@variant\`, \`@compose\`, \`@reference\`, project and stylesheet lowering.
- Runtime/server: hydration, DOM and CSSOM lifecycle, class deletion, retained resources, HTML injection and escaping.
- Rendering Modes: runtime, static, progressive, and pre-render across Vite, Webpack, Next, Astro, Nuxt, and Svelte.
- Binding parity: native and Wasm engine/compiler/tooling must execute identical Rust semantics.

## P0 gaps

The full list is in the JSON ledger; the first ${Math.min(80, p0Gaps.length)} are shown here.

| Source | rc.87 case | Domains |
|---|---|---|
${p0GapRows}

## Dynamic matrices requiring runtime collection

${unresolvedMatrices.length
    ? unresolvedMatrices.map((entry) => `- \`${entry.source.file}:${entry.source.line}\` — ${entry.source.title}`).join('\n')
    : 'All statically discoverable parameter matrices were expanded.'}

## Post-rc.87 overlay

These entries do not affect rc.87 parity completion. \`pending-decision\` entries require
an explicit adopt/defer/reject decision and, when adopted, an approved divergence record.

| Priority | File | Decision | Behavior |
|---|---|---|---|
${overlayRows}

## Completion rule

The migration is complete only when every active rc.87 entry is \`verified-exact\` or
references an explicitly approved parity exception. P0 may not use representative-only
coverage. Source-inactive tests remain visible but do not count as executable proof.
`
}

function buildPackageSummary(entries) {
  const packages = {}
  for (const entry of entries) {
    const summary = packages[entry.source.package] ??= {
      total: 0,
      P0: 0,
      P1: 0,
      P2: 0,
      mapped: 0,
      gap: 0
    }
    summary.total++
    summary[entry.priority]++
    if (entry.migration.status === 'gap') summary.gap++
    else summary.mapped++
  }
  return Object.fromEntries(Object.entries(packages).sort(([left], [right]) => left.localeCompare(right)))
}

function validateLedger(ledger) {
  assert.equal(ledger.baseline.ref, DEFAULT_BASELINE_REF, 'The ledger must remain rooted at v2.0.0-rc.87.')
  assert.equal(ledger.baseline.commit, RC87_COMMIT, 'The rc.87 tag moved unexpectedly.')
  assert.equal(new Set(ledger.entries.map((entry) => entry.id)).size, ledger.entries.length, 'Legacy entry ids must be unique.')
  assert.equal(ledger.entries.length, ledger.baseline.cases, 'Legacy case count does not match the ledger entries.')
  assert.ok(ledger.baseline.testFiles >= 180, 'The collector lost rc.87 test files.')
  assert.ok(ledger.baseline.e2eFiles >= 20, 'The collector lost rc.87 E2E files.')
  for (const entry of ledger.entries) {
    assert.ok(['P0', 'P1', 'P2', 'P3'].includes(entry.priority), `Invalid priority for ${entry.id}.`)
    assert.ok(entry.domains.length, `Missing behavior domain for ${entry.id}.`)
    assert.ok(entry.source.file.startsWith('packages/'), `Out-of-scope source file for ${entry.id}.`)
    assert.ok(['mapped-unverified', 'gap', 'source-inactive', 'verified-exact', 'approved-divergence'].includes(entry.migration.status), `Invalid status for ${entry.id}.`)
    if (entry.migration.status === 'verified-exact') {
      assert.ok(entry.migration.proof, `Verified entry ${entry.id} is missing proof.`)
      assert.ok(['exact-source', 'rc87-golden'].includes(entry.migration.proof.kind), `Invalid exact proof for ${entry.id}.`)
      assert.equal(entry.divergence, null, `Verified entry ${entry.id} cannot carry a divergence.`)
    } else if (entry.migration.status === 'approved-divergence') {
      assert.equal(entry.migration.proof?.kind, 'approved-divergence', `Divergence entry ${entry.id} is missing proof.`)
      assert.ok(entry.divergence, `Divergence entry ${entry.id} is missing exception data.`)
    } else {
      assert.equal(entry.migration.proof, null, `Incomplete entry ${entry.id} cannot carry proof.`)
      assert.equal(entry.divergence, null, `Incomplete entry ${entry.id} cannot carry a divergence.`)
    }
  }
}

function writeOrCheck(file, content, check) {
  if (check) {
    assert.ok(existsSync(file), `${path.relative(process.cwd(), file)} does not exist.`)
    assert.equal(readFileSync(file, 'utf8'), content, `${path.relative(process.cwd(), file)} is stale.`)
  } else {
    writeFileSync(file, content)
  }
}

const baselineRef = DEFAULT_BASELINE_REF
const targetArgument = argument('target')
const targetRef = targetArgument ?? 'latest-target-change'
const postBaselineRef = argument('post-baseline', DEFAULT_POST_BASELINE_REF)
const check = process.argv.includes('--check')
const baselineCommit = resolveRef(baselineRef)
const targetCommit = targetArgument ? resolveRef(targetArgument) : resolveLatestTargetCommit()

const legacyInventory = collectCasesFromRef(baselineRef, baselineCommit)
const targetInventory = collectCasesFromRef(targetRef, targetCommit)
targetInventory.cases.push(...collectSemanticCorpusCases(targetCommit))
targetInventory.cases.push(...collectRustTakeoverCases(targetCommit))
targetInventory.cases.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line || left.title.localeCompare(right.title))
const takeover = loadTakeoverEvidence()
if (process.argv.includes('--seed-semantic-core-evidence')) {
  seedSemanticCoreEvidence(legacyInventory, targetInventory)
}
if (process.argv.includes('--seed-rendering-evidence')) {
  seedRenderingEvidence(legacyInventory, targetInventory)
}
if (process.argv.includes('--seed-authoring-evidence')) {
  seedAuthoringEvidence(legacyInventory, targetInventory)
}
const migrationEvidence = loadMigrationEvidence()
const exceptions = loadParityExceptions()
const mapping = mapCases(legacyInventory, targetInventory, takeover, migrationEvidence, exceptions)
const byStatus = countBy(mapping.entries, (entry) => entry.migration.status)
const byPriority = countBy(mapping.entries, (entry) => entry.priority)
const byCoverage = countBy(mapping.entries, (entry) => entry.migration.coverage)
const byProof = countBy(mapping.entries.filter((entry) => entry.migration.proof), (entry) => entry.migration.proof.kind)

const ledger = {
  $schema: '../scripts/ts-test-migration-ledger.schema.json',
  version: 2,
  policy: {
    baselineAuthority: 'v2.0.0-rc.87 is the only TypeScript behavior baseline.',
    cssBytes: 'Exact bytes or an explicitly approved parity exception.',
    syntaxAndAuthoring: 'Exact behavior or an explicitly approved parity exception.',
    p0Coverage: 'Representative-only coverage is not complete.',
    newerRC: 'Post-rc.87 changes are a separate decision overlay and do not redefine parity.',
    priorities: {
      P0: 'CSS bytes, syntax, authoring, runtime, server rendering, rendering modes, and integration behavior.',
      P1: 'Extraction, validation, lint, language, schema, diagnostics, and project behavior.',
      P2: 'CLI, extension, packaging, host, and peripheral integration behavior.',
      P3: 'Performance, bundle size, examples, site, and benchmark residual risk outside the migration denominator.'
    },
    ciGate: false
  },
  baseline: {
    ref: baselineRef,
    commit: baselineCommit,
    packageCount: legacyInventory.packageCount,
    testFiles: legacyInventory.files.length,
    e2eFiles: legacyInventory.files.filter((file) => file.kind === 'e2e').length,
    cases: legacyInventory.cases.length,
    expandedMatrixCases: legacyInventory.expandedMatrixCases,
    dynamicMatrixCases: legacyInventory.dynamicMatrixCases,
    files: legacyInventory.files
  },
  target: {
    ref: targetRef,
    commit: targetCommit,
    packageCount: targetInventory.packageCount,
    testFiles: targetInventory.files.length,
    e2eFiles: targetInventory.files.filter((file) => file.kind === 'e2e').length,
    cases: targetInventory.cases.length
  },
  existingParity: {
    semanticBaseline: takeover.semanticBaseline,
    expectedLegacyTests: takeover.expectedLegacyTests,
    suites: takeover.suites,
    treatment: 'Historical engine evidence only; every reference must be revalidated against rc.87.'
  },
  evidence: {
    path: path.relative(process.cwd(), evidencePath),
    version: migrationEvidence.version,
    records: migrationEvidence.records.length,
    proofs: byProof
  },
  summary: {
    byStatus,
    byPriority,
    byCoverage,
    byProof,
    byPackage: buildPackageSummary(mapping.entries),
    targetOnlyCases: mapping.targetOnly.length
  },
  postBaselineOverlay: buildPostBaselineOverlay(baselineCommit, postBaselineRef),
  entries: mapping.entries,
  targetOnly: mapping.targetOnly
}

validateLedger(ledger)
const json = `${JSON.stringify(ledger, null, 2)}\n`
const report = buildReport(ledger)
writeOrCheck(ledgerPath, json, check)
writeOrCheck(reportPath, report, check)

console.log(`${check ? 'Validated' : 'Wrote'} ${path.relative(process.cwd(), ledgerPath)} (${ledger.entries.length} rc.87 cases).`)
console.log(`${check ? 'Validated' : 'Wrote'} ${path.relative(process.cwd(), reportPath)}.`)
