import assert from 'node:assert/strict'
import { existsSync, globSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import * as ts from 'typescript6'

const censusPath = path.resolve('.ai/contracts/api-census.json')
const packagesRoot = path.resolve('packages')

const packagePolicies = new Map(Object.entries({
  '@master/create-css': {
    owner: 'project setup planning and application',
    platform: 'node',
    lifecycle: 'plan',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css': {
    owner: 'manifest execution and engine rendering',
    platform: 'universal',
    lifecycle: 'engine-session',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-astro': {
    owner: 'Astro integration lifecycle',
    platform: 'build-host',
    lifecycle: 'integration',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-binding': {
    owner: 'native and Wasm binding loading',
    platform: 'conditional',
    lifecycle: 'binding-session',
    visibility: 'published-internal',
    disposition: 'loader'
  },
  '@master/css-cli': {
    owner: 'command-line host',
    platform: 'node',
    lifecycle: 'command',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-compiler': {
    owner: 'compiler, project, stylesheet, and inspection orchestration',
    platform: 'universal',
    lifecycle: 'compiler-session',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-figma': {
    owner: 'Figma host integration',
    platform: 'figma-host',
    lifecycle: 'host-application',
    visibility: 'host-artifact',
    disposition: 'retain'
  },
  '@master/css-language-server': {
    owner: 'LSP transport and workspace lifecycle',
    platform: 'node',
    lifecycle: 'server',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-language-service': {
    owner: 'editor feature composition and document adaptation',
    platform: 'universal',
    lifecycle: 'service',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-mcp': {
    owner: 'Model Context Protocol host',
    platform: 'node',
    lifecycle: 'server',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-next': {
    owner: 'Next.js integration lifecycle',
    platform: 'build-host',
    lifecycle: 'integration',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-nuxt': {
    owner: 'Nuxt integration lifecycle',
    platform: 'build-host',
    lifecycle: 'integration',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-preset': {
    owner: 'default manifest and CSS assets',
    platform: 'universal',
    lifecycle: 'value',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-runtime': {
    owner: 'browser DOM and CSSOM runtime',
    platform: 'browser',
    lifecycle: 'runtime-session',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-schema': {
    owner: 'serializable contracts and codecs',
    platform: 'universal',
    lifecycle: 'value',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-server': {
    owner: 'HTML rendering and hydration injection',
    platform: 'node',
    lifecycle: 'renderer-session',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-svelte': {
    owner: 'Svelte and SvelteKit integration lifecycle',
    platform: 'build-host',
    lifecycle: 'integration',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-svelte-addon': {
    owner: 'Svelte CLI addon',
    platform: 'node',
    lifecycle: 'command',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-tooling': {
    owner: 'lexer, source, scanner, validator, lint, and language tooling',
    platform: 'universal',
    lifecycle: 'tooling-session',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-vite': {
    owner: 'Vite integration lifecycle',
    platform: 'build-host',
    lifecycle: 'integration',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/css-vscode': {
    owner: 'VS Code extension host',
    platform: 'vscode-host',
    lifecycle: 'host-application',
    visibility: 'host-artifact',
    disposition: 'retain'
  },
  '@master/css-binding-wasm-compiler': {
    owner: 'compiler Wasm artifact delivery',
    platform: 'conditional',
    lifecycle: 'module',
    visibility: 'artifact',
    disposition: 'artifact-only'
  },
  '@master/css-binding-wasm-engine': {
    owner: 'engine Wasm artifact delivery',
    platform: 'conditional',
    lifecycle: 'module',
    visibility: 'artifact',
    disposition: 'artifact-only'
  },
  '@master/css-binding-wasm-tooling': {
    owner: 'tooling Wasm artifact delivery',
    platform: 'conditional',
    lifecycle: 'module',
    visibility: 'artifact',
    disposition: 'artifact-only'
  },
  '@master/css-webpack': {
    owner: 'Webpack integration lifecycle',
    platform: 'build-host',
    lifecycle: 'integration',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/eslint-config-css': {
    owner: 'official ESLint flat configuration',
    platform: 'node',
    lifecycle: 'value',
    visibility: 'public',
    disposition: 'retain'
  },
  '@master/eslint-plugin-css': {
    owner: 'ESLint AST and fixer adaptation',
    platform: 'node',
    lifecycle: 'lint-session',
    visibility: 'public',
    disposition: 'retain'
  }
}))

const bindingTargetPattern = /^@master\/css-binding-(?:darwin|linux|win32)-/
const dependencyFields = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies'
]
const registrySources = {
  cli: path.resolve('packages/cli/src/core.ts'),
  mcp: path.resolve('packages/mcp/src/server.ts')
}
const wireSourcePatterns = [
  'packages/schema/src/**/*.ts',
  'packages/binding/src/protocol.ts',
  'packages/cli/src/**/*.ts',
  'packages/mcp/src/**/*.ts'
]

function readJSON(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function readSource(file) {
  return ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  )
}

function policyFor(packageName) {
  if (bindingTargetPattern.test(packageName)) {
    return {
      owner: 'platform-specific native artifacts',
      platform: 'node',
      lifecycle: 'artifact',
      visibility: 'artifact',
      disposition: 'artifact-only'
    }
  }
  const policy = packagePolicies.get(packageName)
  assert.ok(policy, `API census policy is missing for ${packageName}.`)
  return policy
}

function collectWorkspaceManifests() {
  const files = globSync([
    'packages/*/package.json',
    'examples/*/package.json',
    'internal/package.json',
    'site/package.json'
  ]).sort()
  return files.map((file) => ({
    file,
    manifest: readJSON(file)
  }))
}

function collectConsumers(publicPackageNames) {
  const consumers = new Map(
    [...publicPackageNames].map((packageName) => [packageName, new Set()])
  )
  for (const { file, manifest } of collectWorkspaceManifests()) {
    const consumer = manifest.name || path.dirname(file)
    for (const field of dependencyFields) {
      for (const dependency of Object.keys(manifest[field] || {})) {
        consumers.get(dependency)?.add(consumer)
      }
    }
  }
  return new Map(
    [...consumers].map(([packageName, values]) => [
      packageName,
      [...values].sort()
    ])
  )
}

function collectConditions(value, conditions = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectConditions(item, conditions)
  } else if (value && typeof value === 'object') {
    for (const [condition, target] of Object.entries(value)) {
      conditions.add(condition)
      collectConditions(target, conditions)
    }
  }
  return [...conditions].sort()
}

function collectTargets(value, targets = new Set()) {
  if (typeof value === 'string') {
    targets.add(value)
  } else if (Array.isArray(value)) {
    for (const item of value) collectTargets(item, targets)
  } else if (value && typeof value === 'object') {
    for (const target of Object.values(value)) collectTargets(target, targets)
  }
  return [...targets].sort()
}

function platformFor(packageName, subpath, policy, conditions) {
  if (subpath === './wasm') return 'artifact'
  if (subpath === './client' || subpath.endsWith('/browser')) return 'browser'
  if (
    (packageName === '@master/css-compiler' && subpath === './diagnostics')
    || (packageName === '@master/css-language-service' && subpath === './shiki')
  ) {
    return 'node'
  }
  if (
    subpath === './node'
    || subpath.endsWith('/node')
    || subpath.endsWith('/sync')
    || subpath === './project'
    || subpath === './stylesheet'
    || subpath === './middleware'
    || subpath === './hooks.server'
    || subpath === './server'
  ) {
    return 'node'
  }
  if (conditions.includes('browser') && conditions.includes('node')) return 'conditional'
  if (conditions.includes('browser') && policy.platform === 'conditional') return 'conditional'
  return policy.platform
}

function commonRecord(kind, packageName, consumers, overrides = {}) {
  const policy = policyFor(packageName)
  return {
    kind,
    owner: packageName,
    responsibility: policy.owner,
    consumers: consumers.get(packageName) || [],
    platform: policy.platform,
    lifecycle: policy.lifecycle,
    visibility: policy.visibility,
    disposition: policy.disposition,
    ...overrides
  }
}

function callName(expression) {
  if (!ts.isCallExpression(expression)) return
  if (!ts.isPropertyAccessExpression(expression.expression)) return
  return expression.expression.name.text
}

function stringArgument(call, index) {
  const argument = call.arguments[index]
  return argument && ts.isStringLiteral(argument) ? argument.text : undefined
}

function collectRegistryCalls(file, methodNames) {
  const entries = []
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const method = callName(node)
      if (methodNames.has(method)) {
        const name = stringArgument(node, 0)
        if (name) {
          entries.push({
            method,
            name,
            value: stringArgument(node, 1)
          })
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(readSource(file))
  return entries.sort((left, right) =>
    left.method.localeCompare(right.method) || left.name.localeCompare(right.name)
  )
}

function unwrapLiteral(expression) {
  let current = expression
  while (
    ts.isAsExpression(current)
    || ts.isSatisfiesExpression(current)
    || ts.isParenthesizedExpression(current)
  ) {
    current = current.expression
  }
  if (ts.isNumericLiteral(current)) return Number(current.text)
  if (ts.isStringLiteral(current)) return current.text
}

function collectWireContracts() {
  const records = []
  const files = globSync(wireSourcePatterns).sort()
  for (const file of files) {
    const sourceFile = readSource(file)
    for (const statement of sourceFile.statements) {
      if (!ts.isVariableStatement(statement)) continue
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue
        if (!/(?:^|_)VERSION$/.test(declaration.name.text)) continue
        const value = declaration.initializer
          ? unwrapLiteral(declaration.initializer)
          : undefined
        if (value === undefined) continue
        records.push({
          name: declaration.name.text,
          source: path.relative(process.cwd(), file),
          value
        })
      }
    }
  }
  return records.sort((left, right) =>
    left.source.localeCompare(right.source) || left.name.localeCompare(right.name)
  )
}

function wireOwner(source) {
  if (source.startsWith('packages/schema/')) return '@master/css-schema'
  if (source.startsWith('packages/binding/')) return '@master/css-binding'
  if (source.startsWith('packages/cli/')) return '@master/css-cli'
  return '@master/css-mcp'
}

function createSummary(records) {
  const byKind = {}
  for (const record of records) {
    byKind[record.kind] = (byKind[record.kind] || 0) + 1
  }
  return {
    records: records.length,
    byKind: Object.fromEntries(
      Object.entries(byKind).sort(([left], [right]) => left.localeCompare(right))
    )
  }
}

export function createAPICensus(publicAPIContract) {
  const publicPackageNames = new Set(Object.keys(publicAPIContract))
  const consumers = collectConsumers(publicPackageNames)
  const manifests = new Map(
    globSync('packages/*/package.json')
      .map((file) => readJSON(file))
      .filter(({ private: isPrivate }) => !isPrivate)
      .map((manifest) => [manifest.name, manifest])
  )
  const records = []

  for (const [packageName, contract] of Object.entries(publicAPIContract)) {
    const manifest = manifests.get(packageName)
    assert.ok(manifest, `Published package ${packageName} is missing from the API census.`)
    const policy = policyFor(packageName)
    records.push(commonRecord('package', packageName, consumers, {
      id: `package:${packageName}`,
      package: packageName
    }))
    for (const subpath of contract.exports) {
      const conditions = collectConditions(manifest.exports[subpath])
      const platform = platformFor(packageName, subpath, policy, conditions)
      records.push(commonRecord('subpath', packageName, consumers, {
        id: `subpath:${packageName}:${subpath}`,
        package: packageName,
        subpath,
        conditions,
        targets: collectTargets(manifest.exports[subpath]),
        platform
      }))
      for (const name of contract.entrypoints[subpath] || []) {
        records.push(commonRecord('export', packageName, consumers, {
          id: `export:${packageName}:${subpath}#${name}`,
          package: packageName,
          subpath,
          name,
          platform
        }))
      }
    }
    for (const name of contract.bins) {
      records.push(commonRecord('bin', packageName, consumers, {
        id: `bin:${packageName}:${name}`,
        package: packageName,
        name,
        target: manifest.bin[name],
        platform: 'node',
        lifecycle: 'command'
      }))
    }
  }

  for (const { name } of collectRegistryCalls(registrySources.cli, new Set(['command']))) {
    records.push(commonRecord('cli-command', '@master/css-cli', consumers, {
      id: `cli-command:master-css:${name}`,
      name,
      platform: 'node',
      lifecycle: 'command',
      consumers: ['CLI users']
    }))
  }

  for (const entry of collectRegistryCalls(
    registrySources.mcp,
    new Set(['registerPrompt', 'registerResource', 'registerTool'])
  )) {
    const kind = {
      registerPrompt: 'mcp-prompt',
      registerResource: 'mcp-resource',
      registerTool: 'mcp-tool'
    }[entry.method]
    records.push(commonRecord(kind, '@master/css-mcp', consumers, {
      id: `${kind}:${entry.name}`,
      name: entry.name,
      ...(entry.value ? { uri: entry.value } : {}),
      platform: 'node',
      lifecycle: 'server-request',
      consumers: ['MCP clients']
    }))
  }

  for (const contract of collectWireContracts()) {
    const owner = wireOwner(contract.source)
    const policy = policyFor(owner)
    records.push(commonRecord('wire-contract', owner, consumers, {
      id: `wire-contract:${contract.source}#${contract.name}`,
      name: contract.name,
      source: contract.source,
      value: contract.value,
      platform: 'universal',
      lifecycle: 'serialized-value',
      visibility: policy.visibility === 'published-internal'
        ? 'internal-protocol'
        : 'public-protocol'
    }))
  }

  records.sort((left, right) => left.id.localeCompare(right.id))
  return {
    version: 1,
    sources: [
      '.ai/contracts/public-api.json',
      'packages/*/package.json',
      'packages/cli/src/core.ts',
      'packages/mcp/src/server.ts',
      ...wireSourcePatterns
    ],
    summary: createSummary(records),
    records
  }
}

export function checkAPICensus({
  publicAPIContract,
  write = false
}) {
  const actual = createAPICensus(publicAPIContract)
  if (write) {
    writeFileSync(censusPath, `${JSON.stringify(actual, null, 2)}\n`)
    process.stdout.write(`Updated ${censusPath}.\n`)
    return actual
  }
  assert.equal(existsSync(censusPath), true, `Missing API census ${censusPath}.`)
  assert.deepEqual(
    actual,
    readJSON(censusPath),
    'API census differs from package manifests or CLI/MCP/wire registries. Run "pnpm run check:packages:update" and review it intentionally.'
  )
  process.stdout.write(`Validated ${actual.summary.records} API census record(s).\n`)
  return actual
}
