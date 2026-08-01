import assert from 'node:assert/strict'
import path from 'node:path'
import * as ts from 'typescript6'
import { corePackages, legacyCaseOwnerMap, legacyOwnerMap, sourceExtensions, toolingPackages } from './config.mjs'
import { git, sha256, shortDigest } from './utils.mjs'

function packageOf(file) {
  return file.split('/')[1]
}

export function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim()
}

export function normalizeTitle(value) {
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

export function collectCasesFromRef(ref, commit) {
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

export function collectSemanticCorpusCases(commit) {
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

export function collectRustTakeoverCases(commit) {
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
