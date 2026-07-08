import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import fg from 'fast-glob'
import type MasterCSSMCPContext from './context'
import { getErrorMessage } from './result'

export interface ContributorInput {
  paths?: string[]
  diff?: string
  task?: string
}

export interface PackageGraphInput {
  packageName?: string
  includeExamples?: boolean
}

interface PackageJSON {
  name?: string
  private?: boolean
  scripts?: Record<string, string>
  exports?: unknown
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

interface WorkspacePackage {
  name: string
  path: string
  private: boolean
  kind: 'root' | 'package' | 'site' | 'shared' | 'benchmarks' | 'example'
  scripts: string[]
  exports: string[]
  dependencies: string[]
  dependents: string[]
  aiNotes: string | null
}

interface RoutedPackage {
  name: string
  path: string
  kind: WorkspacePackage['kind'] | 'agent-docs' | 'repo-root'
  packageJSON?: string
  aiNotes?: string | null
  matchedPaths: string[]
}

interface Risk {
  id: string
  severity: 'info' | 'warning' | 'high'
  reason: string
  paths: string[]
}

const REPORT_VERSION = 1
const AUDIENCE = 'master-css-repository-contributors'
const MASTER_REPO_MARKERS = [
  'AGENTS.md',
  '.ai/context/index.md',
  '.ai/context/package-routing.md',
  'packages/mcp/package.json'
]

const PACKAGE_JSON_PATTERNS = [
  'package.json',
  'packages/*/package.json',
  'site/package.json',
  'shared/package.json',
  'benchmarks/package.json',
  'examples/*/package.json'
]

const PACKAGE_JSON_IGNORE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.next/**',
  '**/.svelte-kit/**',
  '**/.vercel/**',
  '**/.turbo/**',
  '**/.tsbuild/**',
  '**/playwright/.cache/**'
]

const HIGH_RISK_PACKAGES: Record<string, string> = {
  engine: 'CSS output and class generation',
  preset: 'default preset and generated manifest output',
  compiler: 'CSS-first manifest lowering',
  runtime: 'runtime hydration, CSSOM insertion, and DOM observation',
  scanner: 'static extraction and generated CSS scanner state',
  source: 'source class candidate extraction',
  language: 'language tokenization and source positions',
  'language-service': 'completion, hover, colors, and semantic token features',
  'language-server': 'LSP behavior',
  lint: 'framework-neutral class lint policy',
  'eslint-plugin': 'ESLint parser support, diagnostics, and autofix ranges'
}

const PACKAGE_COMMON_PACKS: Record<string, string[]> = {
  schema: ['.ai/context/package-boundaries.md'],
  lexer: ['.ai/context/package-boundaries.md'],
  source: ['.ai/context/package-boundaries.md', '.ai/context/testing.md'],
  engine: ['.ai/context/css-output.md', '.ai/context/performance.md'],
  preset: ['.ai/context/css-output.md'],
  facade: ['.ai/context/package-boundaries.md', '.ai/context/css-output.md'],
  compiler: ['.ai/context/css-output.md', '.ai/context/package-boundaries.md'],
  project: ['.ai/context/package-boundaries.md'],
  integration: ['.ai/context/package-boundaries.md'],
  stylesheet: ['.ai/context/css-output.md', '.ai/context/package-boundaries.md'],
  runtime: ['.ai/context/css-output.md', '.ai/context/performance.md'],
  server: ['.ai/context/css-output.md'],
  scanner: ['.ai/context/testing.md', '.ai/context/css-output.md'],
  validator: ['.ai/context/testing.md', '.ai/context/css-output.md'],
  diagnostics: ['.ai/context/testing.md', '.ai/context/package-boundaries.md'],
  lint: ['.ai/context/testing.md', '.ai/context/package-boundaries.md'],
  create: ['.ai/context/testing.md', '.ai/context/package-boundaries.md'],
  'css-sv': ['.ai/context/testing.md', '.ai/context/package-boundaries.md'],
  vite: ['.ai/context/package-boundaries.md', '.ai/context/css-output.md'],
  webpack: ['.ai/context/package-boundaries.md', '.ai/context/css-output.md'],
  next: ['.ai/context/package-boundaries.md', '.ai/context/css-output.md'],
  cli: ['.ai/context/testing.md', '.ai/context/package-boundaries.md']
}

function unique<T>(values: T[]) {
  return [...new Set(values)]
}

function sortStrings(values: string[]) {
  return unique(values.filter(Boolean)).sort((a, b) => a.localeCompare(b))
}

function isMasterCSSRepository(context: MasterCSSMCPContext) {
  return MASTER_REPO_MARKERS.every((marker) => existsSync(resolve(context.root, marker)))
}

function normalizeRepoPath(context: MasterCSSMCPContext, filePath: string) {
  const withoutPrefix = filePath.replace(/^[ab]\//, '')
  const resolved = isAbsolute(withoutPrefix)
    ? resolve(withoutPrefix)
    : resolve(context.root, withoutPrefix)
  context.assertContained(resolved)
  const repoPath = relative(context.root, resolved).split(/[\\/]+/).join('/')
  if (!repoPath || repoPath.startsWith('..')) {
    throw new Error(`Path is outside the repository root: ${filePath}`)
  }
  return repoPath
}

function extractDiffPaths(diff = '') {
  const paths: string[] = []
  const push = (value: string | undefined) => {
    if (!value || value === '/dev/null') return
    paths.push(value)
  }
  for (const line of diff.split('\n')) {
    const gitMatch = line.match(/^diff --git a\/(.+?) b\/(.+)$/)
    if (gitMatch) {
      push(gitMatch[1])
      push(gitMatch[2])
      continue
    }
    const fileMatch = line.match(/^(?:---|\+\+\+) (?:a\/|b\/)?(.+)$/)
    if (fileMatch) {
      push(fileMatch[1])
      continue
    }
    const renameMatch = line.match(/^rename (?:from|to) (.+)$/)
    if (renameMatch) push(renameMatch[1])
  }
  return paths
}

function normalizeInputPaths(context: MasterCSSMCPContext, input: ContributorInput = {}) {
  const rawPaths = [
    ...(input.paths ?? []),
    ...extractDiffPaths(input.diff)
  ]
  return sortStrings(rawPaths.map((path) => normalizeRepoPath(context, path)))
}

async function readJSON<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T
  } catch {
    return null
  }
}

function workspaceKind(path: string): WorkspacePackage['kind'] {
  if (path === '.') return 'root'
  if (path === 'site') return 'site'
  if (path === 'shared') return 'shared'
  if (path === 'benchmarks') return 'benchmarks'
  if (path.startsWith('examples/')) return 'example'
  return 'package'
}

function normalizeExports(exportsField: unknown) {
  if (!exportsField) return []
  if (typeof exportsField === 'string') return ['.']
  if (Array.isArray(exportsField)) return ['.']
  if (typeof exportsField === 'object') return Object.keys(exportsField as Record<string, unknown>).sort()
  return []
}

function collectDependencies(pkg: PackageJSON) {
  return sortStrings([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {})
  ])
}

async function loadWorkspacePackages(context: MasterCSSMCPContext, includeExamples = true) {
  const packageFiles = await fg(PACKAGE_JSON_PATTERNS, {
    cwd: context.root,
    ignore: includeExamples ? PACKAGE_JSON_IGNORE : [...PACKAGE_JSON_IGNORE, 'examples/**'],
    onlyFiles: true
  })
  const packages: WorkspacePackage[] = []
  for (const filePath of packageFiles.sort((a, b) => a.localeCompare(b))) {
    const pkg = await readJSON<PackageJSON>(resolve(context.root, filePath))
    if (!pkg) continue
    const path = filePath === 'package.json' ? '.' : filePath.replace(/\/package\.json$/, '')
    const aiPath = path === '.' ? 'AGENTS.md' : `${path}/AI.md`
    packages.push({
      name: pkg.name || path,
      path,
      private: Boolean(pkg.private),
      kind: workspaceKind(path),
      scripts: Object.keys(pkg.scripts ?? {}).sort(),
      exports: normalizeExports(pkg.exports),
      dependencies: collectDependencies(pkg),
      dependents: [],
      aiNotes: existsSync(resolve(context.root, aiPath)) ? aiPath : null
    })
  }
  const packageNames = new Set(packages.map((pkg) => pkg.name))
  for (const pkg of packages) {
    pkg.dependencies = pkg.dependencies.filter((dependency) => packageNames.has(dependency))
  }
  for (const pkg of packages) {
    for (const dependency of pkg.dependencies) {
      const dependencyPackage = packages.find((candidate) => candidate.name === dependency)
      if (dependencyPackage) dependencyPackage.dependents.push(pkg.name)
    }
  }
  for (const pkg of packages) {
    pkg.dependents = sortStrings(pkg.dependents)
  }
  return packages
}

function routePath(packages: WorkspacePackage[], path: string): Omit<RoutedPackage, 'matchedPaths'> {
  const packageMatch = path.match(/^packages\/([^/]+)(?:\/|$)/)
  if (packageMatch) {
    const packagePath = `packages/${packageMatch[1]}`
    const pkg = packages.find((candidate) => candidate.path === packagePath)
    return {
      name: pkg?.name ?? packagePath,
      path: packagePath,
      kind: pkg?.kind ?? 'package',
      packageJSON: `${packagePath}/package.json`,
      aiNotes: pkg?.aiNotes ?? null
    }
  }
  if (path.startsWith('site/')) {
    const pkg = packages.find((candidate) => candidate.path === 'site')
    return {
      name: pkg?.name ?? 'site',
      path: 'site',
      kind: 'site',
      packageJSON: 'site/package.json',
      aiNotes: pkg?.aiNotes ?? null
    }
  }
  if (path.startsWith('shared/')) {
    const pkg = packages.find((candidate) => candidate.path === 'shared')
    return {
      name: pkg?.name ?? 'shared',
      path: 'shared',
      kind: 'shared',
      packageJSON: 'shared/package.json',
      aiNotes: null
    }
  }
  if (path.startsWith('benchmarks/')) {
    const pkg = packages.find((candidate) => candidate.path === 'benchmarks')
    return {
      name: pkg?.name ?? 'benchmarks',
      path: 'benchmarks',
      kind: 'benchmarks',
      packageJSON: 'benchmarks/package.json',
      aiNotes: null
    }
  }
  const exampleMatch = path.match(/^examples\/([^/]+)(?:\/|$)/)
  if (exampleMatch) {
    const packagePath = `examples/${exampleMatch[1]}`
    const pkg = packages.find((candidate) => candidate.path === packagePath)
    return {
      name: pkg?.name ?? packagePath,
      path: packagePath,
      kind: 'example',
      packageJSON: `${packagePath}/package.json`,
      aiNotes: null
    }
  }
  if (path === 'AGENTS.md' || path.startsWith('.ai/') || path.startsWith('.github/prompts/')) {
    return {
      name: 'agent-docs',
      path: '.ai',
      kind: 'agent-docs',
      aiNotes: null
    }
  }
  const rootPackage = packages.find((candidate) => candidate.path === '.')
  return {
    name: rootPackage?.name ?? 'repo-root',
    path: '.',
    kind: 'repo-root',
    packageJSON: rootPackage ? 'package.json' : undefined,
    aiNotes: rootPackage?.aiNotes ?? null
  }
}

function routePaths(packages: WorkspacePackage[], paths: string[]) {
  const routed = new Map<string, RoutedPackage>()
  for (const path of paths) {
    const route = routePath(packages, path)
    const key = route.path
    const existing = routed.get(key)
    if (existing) {
      existing.matchedPaths.push(path)
    } else {
      routed.set(key, {
        ...route,
        matchedPaths: [path]
      })
    }
  }
  return [...routed.values()].map((route) => ({
    ...route,
    matchedPaths: sortStrings(route.matchedPaths)
  }))
}

function taskPacks(task = '') {
  const normalized = task.toLowerCase()
  const packs: string[] = []
  if (/\b(review|pr)\b/.test(normalized)) packs.push('.ai/context/review.md')
  if (/\b(test|coverage|fixture|snapshot)\b/.test(normalized)) packs.push('.ai/context/testing.md')
  if (/\b(refactor|rewrite|cleanup|migration|re-architecture)\b/.test(normalized)) packs.push('.ai/context/refactor.md')
  if (/\b(css output|generated css|cascade|layer|selector|at-rule|variable|mode|priority|class)\b/.test(normalized)) packs.push('.ai/context/css-output.md')
  if (/\b(performance|benchmark|slow|hot path|memory|cpu)\b/.test(normalized)) packs.push('.ai/context/performance.md')
  if (/\b(doc|docs|readme|site|guide)\b/.test(normalized)) packs.push('.ai/context/docs.md')
  if (/\b(bug|fix|regression|error|failing|failure)\b/.test(normalized)) packs.push('.ai/context/bugfix.md')
  if (/\b(package|boundary|dependency|export|public api|cycle)\b/.test(normalized)) packs.push('.ai/context/package-boundaries.md')
  return packs
}

function pathPacks(paths: string[]) {
  const packs: string[] = []
  if (paths.length) packs.push('.ai/context/package-routing.md')
  if (paths.some((path) => path.includes('/tests/') || path.endsWith('.test.ts') || path.endsWith('.test.js'))) {
    packs.push('.ai/context/testing.md')
  }
  if (paths.some((path) => path.startsWith('site/') || path.endsWith('README.md') || path.endsWith('.mdx'))) {
    packs.push('.ai/context/docs.md')
  }
  if (paths.some((path) => path.endsWith('package.json') || path === 'pnpm-workspace.yaml' || path.includes('tsconfig'))) {
    packs.push('.ai/context/package-boundaries.md')
  }
  return packs
}

function packagePacks(routes: RoutedPackage[]) {
  const packs: string[] = []
  for (const route of routes) {
    const packageMatch = route.path.match(/^packages\/([^/]+)$/)
    const packageName = packageMatch?.[1]
    if (packageName) {
      packs.push(...(PACKAGE_COMMON_PACKS[packageName] ?? []))
      if (packageName.startsWith('language')) packs.push('.ai/context/testing.md')
      if (packageName.startsWith('eslint-')) packs.push('.ai/context/testing.md')
    }
    if (route.kind === 'site') packs.push('.ai/context/docs.md')
    if (route.kind === 'shared') packs.push('.ai/context/package-boundaries.md')
  }
  return packs
}

function pushRisk(risks: Risk[], risk: Risk) {
  const existing = risks.find((candidate) => candidate.id === risk.id)
  if (existing) {
    existing.paths = sortStrings([...existing.paths, ...risk.paths])
    return
  }
  risks.push({
    ...risk,
    paths: sortStrings(risk.paths)
  })
}

function detectRisks(paths: string[], routes: RoutedPackage[]) {
  const risks: Risk[] = []
  for (const route of routes) {
    const packageMatch = route.path.match(/^packages\/([^/]+)$/)
    const packageName = packageMatch?.[1]
    if (packageName && HIGH_RISK_PACKAGES[packageName]) {
      pushRisk(risks, {
        id: packageName === 'engine' || packageName === 'preset' || packageName === 'compiler'
          ? 'css-output'
          : packageName,
        severity: packageName === 'engine' || packageName === 'runtime' || packageName === 'compiler' ? 'high' : 'warning',
        reason: HIGH_RISK_PACKAGES[packageName],
        paths: route.matchedPaths
      })
    }
  }
  if (paths.some((path) => path.endsWith('generated.css') || path.endsWith('.snap') || path.includes('/fixtures/'))) {
    pushRisk(risks, {
      id: 'fixtures-or-snapshots',
      severity: 'high',
      reason: 'Fixture, snapshot, or generated CSS changes must be intentional and covered by tests.',
      paths: paths.filter((path) => path.endsWith('generated.css') || path.endsWith('.snap') || path.includes('/fixtures/'))
    })
  }
  if (paths.some((path) => path.endsWith('package.json') || path === 'pnpm-workspace.yaml' || path.includes('/src/index.ts'))) {
    pushRisk(risks, {
      id: 'public-api-or-package-boundary',
      severity: 'warning',
      reason: 'Package exports, scripts, dependencies, or public entrypoints may affect downstream consumers.',
      paths: paths.filter((path) => path.endsWith('package.json') || path === 'pnpm-workspace.yaml' || path.includes('/src/index.ts'))
    })
  }
  if (paths.some((path) => path.startsWith('site/') || path.endsWith('README.md') || path.endsWith('.mdx'))) {
    pushRisk(risks, {
      id: 'docs',
      severity: 'info',
      reason: 'Public documentation should be verified against source behavior.',
      paths: paths.filter((path) => path.startsWith('site/') || path.endsWith('README.md') || path.endsWith('.mdx'))
    })
  }
  if (paths.some((path) => path.startsWith('.ai/') || path === 'AGENTS.md' || path.startsWith('.github/prompts/'))) {
    pushRisk(risks, {
      id: 'agent-instructions',
      severity: 'info',
      reason: 'AI-facing routing changes should stay consistent with context pack rules.',
      paths: paths.filter((path) => path.startsWith('.ai/') || path === 'AGENTS.md' || path.startsWith('.github/prompts/'))
    })
  }
  if (routes.length > 1) {
    pushRisk(risks, {
      id: 'multi-package',
      severity: 'warning',
      reason: 'Multiple ownership areas changed; package-boundary context and broader validation may be needed.',
      paths
    })
  }
  return risks.sort((a, b) => {
    const order = { high: 0, warning: 1, info: 2 }
    return order[a.severity] - order[b.severity] || a.id.localeCompare(b.id)
  })
}

function contextFiles(paths: string[], routes: RoutedPackage[], risks: Risk[], task?: string) {
  const files = [
    'AGENTS.md',
    '.ai/context/index.md',
    ...pathPacks(paths),
    ...packagePacks(routes),
    ...taskPacks(task),
    ...routes.flatMap((route) => [
      route.packageJSON,
      route.aiNotes
    ].filter(Boolean) as string[])
  ]
  if (risks.some((risk) => risk.severity === 'high' || [
    'public-api-or-package-boundary',
    'multi-package',
    'runtime',
    'scanner',
    'source',
    'language',
    'language-service',
    'language-server',
    'lint',
    'eslint-plugin'
  ].includes(risk.id))) {
    files.push('.ai/context/accuracy-guardrails.md')
  }
  return sortStrings(files)
}

function commandReason(command: string, reason: string) {
  return { command, reason }
}

function validationCommands(packages: WorkspacePackage[], routes: RoutedPackage[], risks: Risk[]) {
  const commands: { command: string, reason: string }[] = []
  const packageByPath = new Map(packages.map((pkg) => [pkg.path, pkg]))
  for (const route of routes) {
    const pkg = packageByPath.get(route.path)
    if (!pkg || pkg.kind === 'root' || pkg.kind === 'example') continue
    if (pkg.scripts.includes('test')) {
      commands.push(commandReason(`pnpm --filter ${pkg.name} test`, `Run ${pkg.name} focused tests.`))
    }
    if (pkg.scripts.includes('e2e') && risks.some((risk) => risk.id === 'runtime' || risk.id === 'css-output')) {
      commands.push(commandReason(`pnpm --filter ${pkg.name} e2e`, `Run ${pkg.name} browser/e2e coverage for high-risk behavior.`))
    }
    if (pkg.scripts.includes('lint')) {
      commands.push(commandReason(`pnpm --filter ${pkg.name} lint`, `Package-local lint is required when ${pkg.name} changes.`))
    }
    if (pkg.scripts.includes('type-check') && risks.some((risk) => risk.id === 'public-api-or-package-boundary')) {
      commands.push(commandReason(`pnpm --filter ${pkg.name} type-check`, `Check public types and package boundary changes in ${pkg.name}.`))
    }
    if (pkg.scripts.includes('build') && risks.some((risk) => risk.id === 'public-api-or-package-boundary')) {
      commands.push(commandReason(`pnpm --filter ${pkg.name} build`, `Build ${pkg.name} after public API or export changes.`))
    }
    if (pkg.kind === 'site' && pkg.scripts.includes('prepare-app')) {
      commands.push(commandReason('pnpm --filter site prepare-app', 'Refresh generated site metadata for docs changes.'))
    }
  }
  if (routes.some((route) => route.kind === 'agent-docs')) {
    commands.push(commandReason('pnpm run test:docs-consistency', 'Validate AI-facing context pack routing consistency.'))
  }
  return unique(commands.map((entry) => JSON.stringify(entry))).map((entry) => JSON.parse(entry) as { command: string, reason: string })
}

function routeStatus(context: MasterCSSMCPContext) {
  const supported = isMasterCSSRepository(context)
  return {
    status: supported ? 'loaded' as const : 'limited' as const,
    reason: supported
      ? 'Master CSS repository markers were found.'
      : 'Contributor routing is optimized for the Master CSS monorepo; generic workspaces return limited package data.'
  }
}

export async function getPackageGraph(context: MasterCSSMCPContext, input: PackageGraphInput = {}) {
  const support = routeStatus(context)
  const packages = await loadWorkspacePackages(context, input.includeExamples ?? true)
  const filtered = input.packageName
    ? packages.filter((pkg) => pkg.name === input.packageName || pkg.path === input.packageName)
    : packages
  return {
    version: REPORT_VERSION,
    audience: AUDIENCE,
    root: context.root,
    ...support,
    packages: filtered,
    summary: {
      packages: filtered.length,
      workspacePackages: filtered.filter((pkg) => pkg.kind === 'package').length,
      examples: filtered.filter((pkg) => pkg.kind === 'example').length
    }
  }
}

async function buildContributorResult(context: MasterCSSMCPContext, input: ContributorInput = {}) {
  const support = routeStatus(context)
  const packages = await loadWorkspacePackages(context)
  const paths = normalizeInputPaths(context, input)
  const routes = routePaths(packages, paths)
  const isLoaded = support.status === 'loaded'
  const risks = isLoaded ? detectRisks(paths, routes) : []
  return {
    version: REPORT_VERSION,
    audience: AUDIENCE,
    root: context.root,
    ...support,
    inputs: {
      task: input.task ?? null,
      paths,
      hasDiff: Boolean(input.diff)
    },
    affectedPackages: routes,
    context: {
      files: isLoaded ? contextFiles(paths, routes, risks, input.task) : [],
      note: isLoaded
        ? 'Read these files as routing inputs; source and nearby tests remain the final authority.'
        : 'Contributor context routing is limited outside the Master CSS repository; no Master CSS repo-specific context files are recommended.'
    },
    risks,
    validation: {
      commands: isLoaded ? validationCommands(packages, routes, risks) : []
    }
  }
}

export async function getRepoContext(context: MasterCSSMCPContext, input: ContributorInput = {}) {
  try {
    return await buildContributorResult(context, input)
  } catch (error) {
    return {
      version: REPORT_VERSION,
      audience: AUDIENCE,
      root: context.root,
      status: 'error' as const,
      error: getErrorMessage(error)
    }
  }
}

export async function getChangeImpact(context: MasterCSSMCPContext, input: ContributorInput = {}) {
  const result = await getRepoContext(context, input)
  if (result.status === 'error') return result
  return {
    version: REPORT_VERSION,
    audience: AUDIENCE,
    root: context.root,
    status: result.status,
    reason: result.reason,
    inputs: result.inputs,
    affectedPackages: result.affectedPackages,
    risks: result.risks,
    summary: {
      riskCount: result.risks.length,
      highRisk: result.risks.filter((risk) => risk.severity === 'high').length,
      packageCount: result.affectedPackages.length
    }
  }
}

export async function getTestRouter(context: MasterCSSMCPContext, input: ContributorInput = {}) {
  const result = await getRepoContext(context, input)
  if (result.status === 'error') return result
  return {
    version: REPORT_VERSION,
    audience: AUDIENCE,
    root: context.root,
    status: result.status,
    reason: result.reason,
    inputs: result.inputs,
    affectedPackages: result.affectedPackages,
    validation: result.validation,
    risks: result.risks.map((risk) => ({
      id: risk.id,
      severity: risk.severity,
      reason: risk.reason
    }))
  }
}
