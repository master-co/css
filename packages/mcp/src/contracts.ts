import { readFile, realpath, stat } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Worker } from 'node:worker_threads'
import fg from 'fast-glob'
import type MasterCSSMCPContext from './context'
import { loadWorkspaceManifest, manifestMetadata } from './project'
import { getErrorMessage } from './result'
import { resolveSourceFiles } from './scan'
import { createMCPToolingSession } from './tooling-session'

/**
 * Contracts of a design system built on Master CSS.
 *
 * A package declares them in its package.json:
 *   "masterCSS": { "contracts": "./dist/contracts.json", "check": "./check/index.js" }
 * `contracts` names a JSON file holding `{ contracts: [...] }`; the optional `check` names an ES module
 * exporting `check(source, contracts, { knows, strict })`. A project adds or replaces contracts with its own
 * JSON files, and a library checking itself declares its `check` in the workspace's own package.json. This module
 * only reads that protocol: it knows no design system by name.
 */

const CONTRACT_REPORT_VERSION = 1
const MAX_CONTRACT_FILE_BYTES = 16 * 1024 * 1024
const MAX_PROJECT_CONTRACT_FILES = 2000
const MAX_CHECK_FILES = 5000
const MAX_CHECK_FILE_BYTES = 2 * 1024 * 1024
const MAX_DIAGNOSTICS_PER_FILE = 500
export const MAX_CHECK_CONTENT_LENGTH = MAX_CHECK_FILE_BYTES
const DEFAULT_CHECK_PATTERNS = ['**/*.{html,htm,jsx,tsx,svelte,astro,vue,mdx,php}']
const DEFAULT_IGNORE_PATTERNS = ['**/node_modules/**', 'node_modules']
const PACKAGE_NAME = /^(?:@[a-z0-9~-][a-z0-9._~-]*\/)?[a-z0-9~-][a-z0-9._~-]*$/i
const NO_CONTRACTS_NOTE = 'No dependency of this workspace declares "masterCSS.contracts" in its package.json, and the project defines no contracts of its own.'
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies'] as const

/** Limits of one checker call, read at every check. A checker that exceeds them is stopped, not the server. */
export const contractCheckerLimits = { timeoutMs: 10_000, memoryMb: 512 }

type JSONRecord = Record<string, unknown>
interface ContractOwner { package: string, version: string | null }
export type ContractSource = ({ kind: 'package' } & ContractOwner) | { kind: 'project', file: string, replaces?: ContractOwner }
interface Contract extends JSONRecord { name: string, classes: unknown[] }
interface LoadedContract {
  contract: Contract
  source: ContractSource
  /** The library whose checker reads this contract: its own, or the one a project contract replaces. */
  library?: string
}
interface ContractLibrary { name: string, version: string | null, count: number, checkPath?: string }
interface ContractWarning { code: string, phase: 'contract-discovery', severity: 'warning', message: string }
interface ContractDiagnostic {
  code: string
  severity: 'error' | 'warning' | 'info'
  message: string
  line: number
  column: number
  className?: string
  contract?: string
  /** The package whose checker reported it. */
  source: string
}
type ContractChecker = (source: string, contracts: Contract[], options: { knows?: (className: string) => boolean, strict: boolean }) => unknown

export interface ListContractsOptions { query?: string, tier?: string, category?: string }
export interface GetContractOptions { name: string }
export interface CheckContractsOptions { content?: string, filePath?: string, patterns?: string[] }

const record = (value: unknown): JSONRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as JSONRecord : {}
const text = (value: unknown) => typeof value === 'string' && value ? value : undefined
const strings = (value: unknown) => (Array.isArray(value) ? value : [value]).filter((item): item is string => typeof item === 'string' && item.length > 0)
const posix = (path: string) => path.replaceAll('\\', '/')

function inside(directory: string, filePath: string) {
  const path = relative(directory, filePath)
  return Boolean(path) && !path.startsWith('..') && !isAbsolute(path)
}

async function readJSON(filePath: string): Promise<{ value: unknown } | { error: string, missing: boolean }> {
  try {
    if ((await stat(filePath)).size > MAX_CONTRACT_FILE_BYTES) return { error: `larger than ${MAX_CONTRACT_FILE_BYTES} bytes`, missing: false }
    return { value: JSON.parse(await readFile(filePath, 'utf8')) }
  } catch (error) {
    return { error: getErrorMessage(error), missing: record(error).code === 'ENOENT' }
  }
}

/** A file inside a package directory, with links resolved so a path cannot leave the package. */
async function resolveInside(directory: string, path: string) {
  if (isAbsolute(path)) return undefined
  try {
    const filePath = await realpath(resolve(directory, path))
    return inside(directory, filePath) && (await stat(filePath)).isFile() ? filePath : undefined
  } catch {
    return undefined
  }
}

/** Where Node resolves a bare package name from the root, without requiring an exported package.json. */
async function findPackageDirectory(root: string, name: string) {
  for (let directory = root; ; directory = dirname(directory)) {
    const manifest = join(directory, 'node_modules', name, 'package.json')
    if ((await stat(manifest).catch(() => undefined))?.isFile()) return realpath(dirname(manifest))
    if (dirname(directory) === directory) return undefined
  }
}

const exists = (path: string) => stat(path).then(() => true, () => false)

/** The nearest ancestor that roots a workspace, without leaving the repository that holds the root. */
async function findWorkspaceRoot(root: string) {
  if (await exists(join(root, '.git'))) return undefined
  for (let directory = dirname(root); directory !== dirname(directory); directory = dirname(directory)) {
    const manifest = await readJSON(join(directory, 'package.json'))
    const pkg = record('value' in manifest ? manifest.value : undefined)
    if (pkg.workspaces || await exists(join(directory, 'pnpm-workspace.yaml'))) return { directory, pkg }
    if (await exists(join(directory, '.git'))) return undefined
  }
  return undefined
}

const isContract = (value: unknown): value is Contract => typeof record(value).name === 'string' && record(value).name !== '' && Array.isArray(record(value).classes)

/** One contract, or the contracts of a `{ contracts: [...] }` file. Anything else holds none. */
function contractsIn(value: unknown) {
  if (isContract(value)) return [value]
  const { contracts } = record(value)
  return Array.isArray(contracts) ? contracts.filter(isContract) : []
}

const classNamesOf = (contract: Contract) => contract.classes.flatMap(entry => text(record(entry).name) ?? [])

/** The libraries among the dependencies a package.json declares, resolved from its directory. */
async function readLibraries(root: string, pkg: JSONRecord, libraries: ContractLibrary[], merged: Map<string, LoadedContract>, warn: (code: string, message: string) => void) {
  for (const dependency of new Set(DEPENDENCY_FIELDS.flatMap(field => Object.keys(record(pkg[field]))))) {
    if (!PACKAGE_NAME.test(dependency)) continue
    const directory = await findPackageDirectory(root, dependency)
    if (!directory) continue
    const manifest = await readJSON(join(directory, 'package.json'))
    if (!('value' in manifest)) continue
    const pkg = record(manifest.value)
    const declared = record(pkg.masterCSS)
    const contractPaths = strings(declared.contracts)
    if (!contractPaths.length) continue
    const owner = { package: text(pkg.name) ?? dependency, version: text(pkg.version) ?? null }
    // Two dependency names may resolve to one package, such as an alias beside the package itself.
    if (libraries.some(library => library.name === owner.package)) continue
    const library: ContractLibrary = { name: owner.package, version: owner.version, count: 0 }
    for (const path of contractPaths) {
      const filePath = await resolveInside(directory, path)
      const file = filePath ? await readJSON(filePath) : { error: 'not a file inside the package', missing: true }
      if (!('value' in file)) {
        warn('CONTRACT_FILE_UNREADABLE', `${owner.package} declares masterCSS.contracts "${path}", which could not be read: ${file.error}`)
        continue
      }
      for (const contract of contractsIn(file.value)) {
        library.count++
        const existing = merged.get(contract.name)
        if (existing) {
          const other = existing.source.kind === 'package' ? existing.source.package : existing.source.file
          if (other !== owner.package) warn('CONTRACT_NAME_COLLISION', `${owner.package} and ${other} both declare a contract named "${contract.name}"; ${other} is kept.`)
          continue
        }
        merged.set(contract.name, { contract, source: { kind: 'package', ...owner }, library: owner.package })
      }
    }
    const check = text(declared.check)
    if (check) {
      // Only a file of the declaring dependency may ever be imported as a checker.
      library.checkPath = await resolveInside(directory, check)
      if (!library.checkPath) warn('CONTRACT_CHECKER_UNRESOLVED', `${owner.package} declares masterCSS.check "${check}", which is not a file inside the package.`)
    }
    libraries.push(library)
  }
}

/** Read every contract that applies to the workspace. Nothing here executes package or project code. */
export async function discoverContracts(context: MasterCSSMCPContext) {
  const warnings: ContractWarning[] = []
  const warn = (code: string, message: string) => { warnings.push({ code, phase: 'contract-discovery', severity: 'warning', message }) }
  const rootManifest = await readJSON(join(context.root, 'package.json'))
  if (!('value' in rootManifest) && !rootManifest.missing) warn('CONTRACT_PACKAGE_JSON_UNREADABLE', `The workspace package.json could not be read: ${rootManifest.error}`)
  const rootPackage = record('value' in rootManifest ? rootManifest.value : undefined)

  const libraries: ContractLibrary[] = []
  const merged = new Map<string, LoadedContract>()
  await readLibraries(context.root, rootPackage, libraries, merged, warn)
  // An app of a monorepo often leaves its design system to the dependencies of the workspace root.
  if (!libraries.length) {
    const workspace = await findWorkspaceRoot(context.root)
    if (workspace) await readLibraries(workspace.directory, workspace.pkg, libraries, merged, warn)
  }

  // The project's own contracts: globs of the root package.json, and the directory and globs of master-ui.json.
  const patterns = strings(record(rootPackage.masterCSS).contracts)
  const settingsFile = await readJSON(join(context.root, 'master-ui.json'))
  if ('value' in settingsFile) {
    const settings = record(settingsFile.value)
    patterns.push(`${text(settings.directory) ?? 'ui'}/*.json`, ...strings(settings.contracts))
  } else if (!settingsFile.missing) {
    warn('CONTRACT_SETTINGS_UNREADABLE', `master-ui.json could not be read: ${settingsFile.error}`)
  }
  const accepted: string[] = []
  for (const pattern of new Set(patterns.map(pattern => posix(pattern).replace(/^(?:\.\/)+/, '').replace(/\/{2,}/g, '/')))) {
    try {
      context.validateGlobPatterns([pattern])
      accepted.push(pattern)
    } catch (error) {
      warn('CONTRACT_PATTERN_REJECTED', getErrorMessage(error))
    }
  }
  const files = accepted.length
    ? (await fg(accepted, { cwd: context.root, ignore: DEFAULT_IGNORE_PATTERNS, onlyFiles: true, followSymbolicLinks: false })).sort()
    : []
  if (files.length > MAX_PROJECT_CONTRACT_FILES) {
    warn('CONTRACT_FILES_TRUNCATED', `The project's contract patterns match ${files.length} files; only the first ${MAX_PROJECT_CONTRACT_FILES} are read.`)
    files.length = MAX_PROJECT_CONTRACT_FILES
  }
  for (const file of files) {
    const filePath = await context.resolveExistingFile(file).catch(() => undefined)
    const parsed = filePath ? await readJSON(filePath) : undefined
    // A JSON file that is not a contract is someone else's file: leave it alone.
    if (!parsed || !('value' in parsed)) continue
    for (const contract of contractsIn(parsed.value)) {
      const previous = merged.get(contract.name)
      const replaces = previous?.source.kind === 'package'
        ? { package: previous.source.package, version: previous.source.version }
        : previous?.source.replaces
      merged.set(contract.name, {
        contract,
        source: { kind: 'project', file: posix(file), ...(replaces ? { replaces } : {}) },
        library: previous?.library
      })
    }
  }

  // A library in its own repository checks its contracts with the checker it ships.
  const ownCheck = text(record(rootPackage.masterCSS).check)
  if (ownCheck) {
    const checkPath = await resolveInside(await realpath(context.root), ownCheck)
    if (checkPath) {
      const name = text(rootPackage.name) ?? 'workspace'
      const own: ContractLibrary = { name, version: text(rootPackage.version) ?? null, count: 0, checkPath }
      for (const item of merged.values()) {
        if (item.source.kind === 'project' && !item.library) { item.library = name; own.count++ }
      }
      libraries.unshift(own)
    } else {
      warn('CONTRACT_CHECKER_UNRESOLVED', `The workspace package.json declares masterCSS.check "${ownCheck}", which is not a file inside the workspace.`)
    }
  }
  return { libraries, contracts: [...merged.values()], warnings }
}

const describeLibrary = ({ name, version, count, checkPath }: ContractLibrary) => ({ name, version, count, checker: Boolean(checkPath) })

export async function listContracts(context: MasterCSSMCPContext, options: ListContractsOptions = {}) {
  const discovery = await discoverContracts(context)
  const terms = (options.query ?? '').toLowerCase().split(/\s+/).filter(Boolean)
  const same = (value: unknown, expected?: string) => !expected?.trim() || text(value)?.toLowerCase() === expected.trim().toLowerCase()
  const matched = discovery.contracts.filter(({ contract }) => {
    if (!same(contract.tier, options.tier) || !same(contract.category, options.category)) return false
    const searched = [contract.name, text(contract.title), text(contract.description), text(contract.use), ...classNamesOf(contract)].join('\n').toLowerCase()
    return terms.every(term => searched.includes(term))
  })
  return {
    version: CONTRACT_REPORT_VERSION,
    root: context.root,
    libraries: discovery.libraries.map(describeLibrary),
    contracts: matched.map(({ contract, source }) => ({
      name: contract.name,
      title: text(contract.title),
      tier: text(contract.tier),
      category: text(contract.category),
      description: text(contract.description),
      use: text(contract.use),
      script: text(contract.script),
      source
    })),
    diagnostics: discovery.warnings,
    summary: { libraries: discovery.libraries.length, contracts: discovery.contracts.length, returned: matched.length },
    ...(discovery.contracts.length ? {} : { note: NO_CONTRACTS_NOTE })
  }
}

function editDistance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    previous = current
  }
  return previous[b.length]
}

/** The names nearest to what was asked: one that contains it first, then a near spelling or a name it contains. */
function closest(target: string, candidates: readonly string[], limit = 5) {
  const wanted = target.toLowerCase()
  return candidates
    .map(candidate => {
      const name = candidate.toLowerCase()
      const gap = Math.abs(name.length - wanted.length) / 100
      const distance = name.includes(wanted) ? gap : Math.min(editDistance(wanted, name), wanted.includes(name) ? 1 + gap : Infinity)
      return { candidate, distance }
    })
    .sort((a, b) => a.distance - b.distance || a.candidate.localeCompare(b.candidate))
    .slice(0, limit)
    .map(item => item.candidate)
}

export async function getContract(context: MasterCSSMCPContext, options: GetContractOptions) {
  const discovery = await discoverContracts(context)
  const name = options.name.trim()
  const byClass = new Map<string, LoadedContract>()
  for (const item of discovery.contracts) {
    for (const className of classNamesOf(item.contract)) if (!byClass.has(className)) byClass.set(className, item)
  }
  const named = discovery.contracts.find(item => item.contract.name === name)
  const found = named ?? byClass.get(name)
  if (!found) {
    const classes = closest(name, [...byClass.keys()])
    // A misspelled class most likely belongs to the contract of its nearest spelling.
    const contracts = [...new Set([
      ...classes.slice(0, 2).map(className => byClass.get(className)!.contract.name),
      ...closest(name, discovery.contracts.map(item => item.contract.name))
    ])].slice(0, 5)
    const missing = `No contract is named "${name}" and no contract has a class "${name}".`
    const lookup = (message: string, alternatives: string[]) => ({ code: 'CONTRACT_NOT_FOUND', phase: 'contract-lookup', severity: 'info', message, alternatives })
    throw Object.assign(new Error(discovery.contracts.length
      ? `${missing} Closest contracts: ${contracts.join(', ')}. Closest classes: ${classes.join(', ')}. Call mastercss_contract_list for every contract.`
      : `${missing} ${NO_CONTRACTS_NOTE}`
    ), {
      code: 'CONTRACT_NOT_FOUND',
      diagnostics: [
        ...(contracts.length ? [lookup('Closest contract names.', contracts)] : []),
        ...(classes.length ? [lookup('Closest class names.', classes)] : []),
        ...discovery.warnings
      ]
    })
  }
  return {
    version: CONTRACT_REPORT_VERSION,
    root: context.root,
    name,
    matched: named ? 'contract' as const : 'class' as const,
    contract: found.contract,
    source: found.source,
    diagnostics: discovery.warnings
  }
}

const checkerFailure = (library: ContractLibrary, action: string, error: unknown) =>
  Object.assign(new Error(`The contract checker of ${library.name} ${action}: ${getErrorMessage(error)}`), { code: 'CONTRACT_CHECKER_FAILED' })

/**
 * The worker that runs one checker. It imports the module afresh, so an upgraded library needs no restart, and
 * the server can stop a checker that hangs or exhausts its memory. `knows` stays in the server: the worker asks
 * for each class it has not seen and waits for the answer, so a checker still calls it synchronously.
 */
const CHECKER_WORKER = `
const { parentPort, workerData } = require('node:worker_threads')
const { checkURL, contracts, signal } = workerData
const answers = new Map()
function knows(className) {
  const key = String(className)
  if (!answers.has(key)) {
    Atomics.store(signal, 0, 0)
    parentPort.postMessage({ type: 'knows', className: key })
    Atomics.wait(signal, 0, 0)
    answers.set(key, signal[1] === 1)
  }
  return answers.get(key)
}
const describe = error => error instanceof Error ? error.message : String(error)
const loading = import(checkURL).then(module => {
  if (typeof module.check !== 'function') throw new Error('the module does not export a check function')
  return module.check
})
loading.then(() => parentPort.postMessage({ type: 'ready' }), error => parentPort.postMessage({ type: 'failed', message: describe(error) }))
parentPort.on('message', async ({ content, strict, withKnows }) => {
  try {
    const reported = await (await loading)(content, contracts, withKnows ? { knows, strict } : { strict })
    parentPort.postMessage(Array.isArray(reported)
      ? { type: 'result', diagnostics: JSON.parse(JSON.stringify(reported.slice(0, ${MAX_DIAGNOSTICS_PER_FILE}))) }
      : { type: 'failed', message: 'check() did not return an array of diagnostics' })
  } catch (error) {
    parentPort.postMessage({ type: 'failed', message: describe(error) })
  }
})
`

/** Start the checker a library ships. Discovery already proved the file is inside that library. */
async function startChecker(library: ContractLibrary, contracts: Contract[], knows?: (className: string) => boolean) {
  const { timeoutMs, memoryMb } = contractCheckerLimits
  const signal = new Int32Array(new SharedArrayBuffer(8))
  const worker = new Worker(CHECKER_WORKER, {
    eval: true,
    stdout: true,
    workerData: { checkURL: pathToFileURL(library.checkPath!).href, contracts, signal },
    resourceLimits: { maxOldGenerationSizeMb: memoryMb }
  })
  // The stdio transport owns stdout: what a checker prints goes to stderr.
  worker.stdout.pipe(process.stderr, { end: false })
  let waiting: { resolve: (message: JSONRecord) => void, reject: (error: unknown) => void } | undefined
  let ended: Error | undefined
  const end = (error: Error) => {
    ended ??= error
    waiting?.reject(ended)
    waiting = undefined
  }
  worker.on('error', end)
  worker.on('exit', code => end(new Error(`its worker stopped with exit code ${code}`)))
  worker.on('message', (message: JSONRecord) => {
    if (message.type === 'knows') {
      signal[1] = knows?.(String(message.className)) ? 1 : 0
      Atomics.store(signal, 0, 1)
      Atomics.notify(signal, 0)
      return
    }
    const current = waiting
    waiting = undefined
    if (message.type === 'failed') current?.reject(new Error(String(message.message)))
    else current?.resolve(message)
  })
  /** The worker's next answer, or the reason it gave none within the time limit. */
  const answer = (action: string, send?: () => void) => new Promise<JSONRecord>((resolve, reject) => {
    if (ended) return reject(ended)
    const timer = setTimeout(() => {
      end(new Error(`did not finish within ${timeoutMs} ms`))
      void worker.terminate()
    }, timeoutMs)
    waiting = {
      resolve: (message) => { clearTimeout(timer); resolve(message) },
      reject: (error) => { clearTimeout(timer); reject(error) }
    }
    send?.()
  }).catch((error: unknown) => { throw checkerFailure(library, action, error) })
  const dispose = async () => { ended ??= new Error('its worker was stopped'); await worker.terminate() }
  try {
    await answer('could not be loaded')
  } catch (error) {
    await dispose()
    throw error
  }
  return {
    check: async (content: string, strict: boolean, filePath: string) =>
      (await answer(`failed on ${filePath}`, () => worker.postMessage({ content, strict, withKnows: Boolean(knows) }))).diagnostics as unknown[],
    dispose
  }
}

function normalizeDiagnostic(value: unknown, source: string): ContractDiagnostic[] {
  const diagnostic = record(value)
  if (typeof diagnostic.message !== 'string') return []
  const position = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0
  const className = text(diagnostic.className)
  const contract = text(diagnostic.contract)
  return [{
    code: text(diagnostic.code) ?? 'contract',
    severity: diagnostic.severity === 'warning' || diagnostic.severity === 'info' ? diagnostic.severity : 'error',
    message: diagnostic.message,
    line: position(diagnostic.line),
    column: position(diagnostic.column),
    ...(className ? { className } : {}),
    ...(contract ? { contract } : {}),
    source
  }]
}

async function readCheckInputs(context: MasterCSSMCPContext, options: CheckContractsOptions) {
  const skippedFiles: { filePath: string, reason: string }[] = []
  if (options.content !== undefined) {
    return { inputs: [{ filePath: context.resolveVirtualPath(options.filePath || 'index.html'), content: options.content }], skippedFiles }
  }
  // Without patterns the search follows the project's ignore files, as a scan does.
  const filePaths = await resolveSourceFiles(context, options.patterns ?? DEFAULT_CHECK_PATTERNS, options.patterns ? [] : DEFAULT_IGNORE_PATTERNS, Boolean(options.patterns))
  if (filePaths.length > MAX_CHECK_FILES) {
    throw Object.assign(new Error(`The patterns match ${filePaths.length} files; a contract check reads at most ${MAX_CHECK_FILES}. Pass narrower patterns.`), { code: 'CONTRACT_CHECK_TOO_MANY_FILES' })
  }
  const inputs: { filePath: string, content: string }[] = []
  for (const filePath of filePaths) {
    if ((await stat(filePath)).size > MAX_CHECK_FILE_BYTES) skippedFiles.push({ filePath, reason: `larger than ${MAX_CHECK_FILE_BYTES} bytes` })
    else inputs.push({ filePath, content: await readFile(filePath, 'utf8') })
  }
  return { inputs, skippedFiles }
}

export async function checkContracts(context: MasterCSSMCPContext, options: CheckContractsOptions = {}) {
  const discovery = await discoverContracts(context)
  const report = { version: CONTRACT_REPORT_VERSION, root: context.root, libraries: discovery.libraries.map(describeLibrary) }
  const notChecked = (status: 'no-contracts' | 'no-checker', note: string) => ({
    ...report,
    checkers: [],
    classValidation: 'none' as const,
    strict: false,
    files: [],
    diagnostics: discovery.warnings,
    coverage: { status, checkedFiles: [], skippedFiles: [], description: `${note} No markup was checked; zero diagnostics does not verify any source.` },
    summary: { checkedFiles: 0, filesWithDiagnostics: 0, diagnostics: 0, errors: 0, warnings: 0 },
    note
  })
  if (!discovery.contracts.length) return notChecked('no-contracts', NO_CONTRACTS_NOTE)
  const checking = discovery.libraries.filter(library => library.checkPath)
  if (!checking.length) {
    return notChecked('no-checker', 'Contracts were found, but no library declares a checker in "masterCSS.check". Read contracts with mastercss_contract_list and mastercss_contract_get.')
  }

  // Each checker reads its own library's contracts, as the project replaced them. Contracts no checker owns,
  // such as a component only the project defines, go to the first one.
  const groups = checking.map((library, index) => ({
    library,
    contracts: discovery.contracts
      .filter(item => (checking.some(other => other.name === item.library) ? item.library === library.name : index === 0))
      .map(item => item.contract)
  })).filter(group => group.contracts.length)
  const { inputs, skippedFiles } = await readCheckInputs(context, options)

  // `knows` answers from the project manifest; without one the checker is told nothing and cannot be strict.
  const manifest = await loadWorkspaceManifest(context)
  const session = manifest.status === 'loaded' ? createMCPToolingSession(manifest.manifest, manifest.nativeClassNames) : undefined
  const checkers: (typeof groups[number] & Awaited<ReturnType<typeof startChecker>>)[] = []
  try {
    let knows: ((className: string) => boolean) | undefined
    if (session) {
      const native = new Set(manifest.nativeClassNames)
      const known = new Map<string, boolean>()
      knows = (className) => {
        if (native.has(className)) return true
        let result = known.get(className)
        if (result === undefined) {
          try { result = session.inspectClassName(className).matchStatus === 'matched' } catch { result = false }
          known.set(className, result)
        }
        return result
      }
    }
    const strict = Boolean(knows)
    for (const group of groups) checkers.push({ ...group, ...await startChecker(group.library, group.contracts, knows) })
    const results: { filePath: string, diagnostics: ContractDiagnostic[] }[] = []
    for (const input of inputs) {
      const diagnostics: ContractDiagnostic[] = []
      for (const { library, check } of checkers) {
        const reported = await check(input.content, strict, input.filePath)
        diagnostics.push(...reported.flatMap(diagnostic => normalizeDiagnostic(diagnostic, library.name)))
      }
      diagnostics.sort((a, b) => a.line - b.line || a.column - b.column)
      results.push({ filePath: input.filePath, diagnostics })
    }
    const files = results.filter(file => file.diagnostics.length)
    const flat = files.flatMap(file => file.diagnostics.map(diagnostic => ({ ...diagnostic, phase: 'contract-check', filePath: file.filePath })))
    return {
      ...report,
      manifest: manifestMetadata(manifest),
      checkers: checkers.map(({ library, contracts }) => ({ package: library.name, version: library.version, contracts: contracts.length })),
      classValidation: knows ? 'project-manifest' as const : 'none' as const,
      strict,
      files,
      diagnostics: [...discovery.warnings, ...flat],
      coverage: {
        status: inputs.length ? 'complete' as const : 'no-inputs' as const,
        checkedFiles: inputs.map(input => input.filePath),
        skippedFiles,
        description: inputs.length
          ? 'Every path in checkedFiles was read by the checkers listed in checkers. The files array lists only files with diagnostics. A checker reads markup as written: classes built at run time, parts whose root lives in another file, and browser behavior are not checked.'
          : 'No markup inputs matched, so no checker ran. Zero diagnostics does not verify any source.'
      },
      summary: {
        checkedFiles: inputs.length,
        filesWithDiagnostics: files.length,
        diagnostics: flat.length,
        errors: flat.filter(diagnostic => diagnostic.severity === 'error').length,
        warnings: flat.filter(diagnostic => diagnostic.severity === 'warning').length
      },
      ...(knows ? {} : { note: `The project manifest could not be loaded (${manifest.status === 'error' ? manifest.error : 'unknown'}), so the checker cannot tell a utility from a misspelled class and ran without strict mode.` })
    }
  } finally {
    await Promise.all(checkers.map(checker => checker.dispose()))
    session?.dispose()
  }
}
