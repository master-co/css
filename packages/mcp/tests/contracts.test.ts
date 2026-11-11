import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv'
import { afterEach, describe, expect, it } from 'vitest'
import { contractCheckerLimits } from '../src/contracts'
import { createMasterCSSMCPServer } from '../src/server'

const tempDirs: string[] = []
const closers: (() => Promise<void>)[] = []

function write(root: string, file: string, value: unknown) {
  mkdirSync(dirname(join(root, file)), { recursive: true })
  writeFileSync(join(root, file), typeof value === 'string' ? value : JSON.stringify(value, null, 2))
}

const button = {
  name: 'button', title: 'Button', tier: 'component', category: 'Actions',
  description: 'A raised control.', use: 'An action in the page: save, open, confirm.', script: 'none',
  classes: [
    { name: 'btn', kind: 'root', description: 'The base button', elements: ['button', 'a'] },
    { name: 'btn-primary', kind: 'modifier', of: 'btn', description: 'The main action of a view' }
  ],
  example: '<button class="btn">Save</button>'
}
const dialog = {
  name: 'dialog', title: 'Dialog', tier: 'component', category: 'Overlays',
  description: 'A modal surface.', use: 'A decision that interrupts the page.', script: 'optional',
  classes: [{ name: 'dialog', kind: 'root', description: 'The surface', label: true }],
  example: '<dialog class="dialog" aria-label="Confirm"></dialog>'
}

// A checker small enough to read: a modifier needs its base, a labelled root needs a name, and a class that
// only looks like a root's is reported unless the host knows it.
const checker = `
const position = (source, index) => {
  const before = source.slice(0, index).split('\\n')
  return { line: before.length, column: before.at(-1).length + 1 }
}
export function check(source, contracts, options = {}) {
  const entries = new Map(contracts.flatMap(contract => contract.classes.map(entry => [entry.name, { entry, contract }])))
  const roots = [...entries.values()].filter(({ entry }) => entry.kind === 'root').map(({ entry }) => entry.name)
  const diagnostics = []
  for (const match of source.matchAll(/<[a-z]+[^>]*?class="([^"]*)"[^>]*>/g)) {
    const classes = match[1].split(/\\s+/).filter(Boolean)
    for (const className of classes) {
      const known = entries.get(className)
      if (!known) {
        if (roots.some(root => className.startsWith(root + '-')) && !options.knows?.(className)) {
          diagnostics.push({ code: 'unknown-class', severity: options.strict ? 'error' : 'warning', message: className + ' is not a class of a contract.', className, ...position(source, match.index) })
        }
        continue
      }
      const { entry, contract } = known
      if (entry.kind === 'modifier' && !classes.includes(entry.of)) {
        diagnostics.push({ code: 'missing-base', severity: 'error', message: className + ' modifies ' + entry.of + '.', className, contract: contract.name, ...position(source, match.index) })
      }
      if (entry.label && !/aria-label=/.test(match[0])) {
        diagnostics.push({ code: 'label', severity: 'error', message: className + ' needs an accessible name.', className, contract: contract.name, ...position(source, match.index) })
      }
    }
  }
  return diagnostics
}
`

/** A workspace with one library that ships contracts and a checker, a plain dependency, and its own contracts. */
function createWorkspace() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-mcp-contracts-')))
  tempDirs.push(root)
  write(root, 'package.json', {
    name: 'app',
    dependencies: { 'fake-ui': '^1.0.0', 'plain-lib': '^1.0.0' },
    devDependencies: { 'not-installed': '^1.0.0' },
    masterCSS: { contracts: ['./contracts/*.json'] }
  })
  write(root, 'node_modules/fake-ui/package.json', { name: 'fake-ui', version: '1.2.3', type: 'module', masterCSS: { contracts: './dist/contracts.json', check: './check/index.js' } })
  write(root, 'node_modules/fake-ui/dist/contracts.json', { name: 'fake-ui', contracts: [button, dialog] })
  write(root, 'node_modules/fake-ui/check/index.js', checker)
  write(root, 'node_modules/plain-lib/package.json', { name: 'plain-lib', version: '1.0.0' })
  // Declared by a package that is not a dependency of the workspace: never read.
  write(root, 'node_modules/stray-ui/package.json', { name: 'stray-ui', version: '9.0.0', masterCSS: { contracts: './contracts.json' } })
  write(root, 'node_modules/stray-ui/contracts.json', { contracts: [{ ...dialog, name: 'stray' }] })
  // The project owns its button and defines a component the library does not have.
  write(root, 'master-ui.json', { directory: 'ui' })
  write(root, 'ui/button.json', { ...button, description: 'The project\'s own button.', classes: [...button.classes, { name: 'btn-ghost', kind: 'modifier', of: 'btn', description: 'No material' }] })
  write(root, 'ui/notes.json', { title: 'Not a contract' })
  write(root, 'contracts/prose.json', { name: 'prose', title: 'Prose', tier: 'layout', category: 'Typography', description: 'Long-form text.', use: 'An article body.', script: 'none', classes: [{ name: 'text', kind: 'root', description: 'The text block' }] })
  return root
}

async function connect(root: string) {
  const server = createMasterCSSMCPServer({ root })
  const client = new Client({ name: 'contracts-test', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(a), client.connect(b)])
  closers.push(async () => { await client.close(); await server.dispose() })
  const tools = (await client.listTools()).tools
  const validator = new AjvJsonSchemaValidator()
  /** Call a tool and hold every response to its published output schema. */
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const response = await client.callTool({ name, arguments: args })
    const tool = tools.find(tool => tool.name === name)!
    expect(validator.getValidator(tool.outputSchema!)(response.structuredContent).valid, JSON.stringify(response.structuredContent)).toBe(true)
    expect(response.structuredContent).toEqual(JSON.parse((response.content as { text: string }[])[0].text))
    return response as { isError?: boolean, structuredContent: any }
  }
  const data = async (name: string, args: Record<string, unknown> = {}) => {
    const response = await call(name, args)
    expect(response.isError, JSON.stringify(response.structuredContent)).not.toBe(true)
    return response.structuredContent.result.data
  }
  return { tools, call, data }
}

afterEach(async () => {
  for (const close of closers.splice(0)) await close()
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('design system contracts', () => {
  it('registers the contract tools as read-only', async () => {
    const { tools } = await connect(createWorkspace())
    for (const name of ['mastercss_contract_list', 'mastercss_contract_get', 'mastercss_contract_check']) {
      expect(tools.find(tool => tool.name === name)?.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false })
    }
  })

  it('discovers the contracts of declared dependencies and lets the project replace them', async () => {
    const { data } = await connect(createWorkspace())
    const list = await data('mastercss_contract_list')
    // plain-lib has no masterCSS field, not-installed does not resolve, stray-ui is not a dependency.
    expect(list.libraries).toEqual([{ name: 'fake-ui', version: '1.2.3', count: 2, checker: true }])
    expect(list.contracts.map((contract: any) => contract.name)).toEqual(['button', 'dialog', 'prose'])
    expect(list.summary).toEqual({ libraries: 1, contracts: 3, returned: 3 })
    expect(list.note).toBeUndefined()
    const [ownButton, libraryDialog, prose] = list.contracts
    expect(ownButton).toEqual({
      name: 'button', title: 'Button', tier: 'component', category: 'Actions', description: 'The project\'s own button.',
      use: button.use, script: 'none', source: { kind: 'project', file: 'ui/button.json', replaces: { package: 'fake-ui', version: '1.2.3' } }
    })
    expect(libraryDialog.source).toEqual({ kind: 'package', package: 'fake-ui', version: '1.2.3' })
    expect(prose.source).toEqual({ kind: 'project', file: 'contracts/prose.json' })
  })

  it('filters the list by query, tier and category', async () => {
    const { data } = await connect(createWorkspace())
    const names = async (args: Record<string, unknown>) => (await data('mastercss_contract_list', args)).contracts.map((contract: any) => contract.name)
    expect(await names({ query: 'BTN-GHOST' })).toEqual(['button'])
    expect(await names({ query: 'interrupts' })).toEqual(['dialog'])
    expect(await names({ query: 'modal surface' })).toEqual(['dialog'])
    expect(await names({ query: 'no-such-thing' })).toEqual([])
    expect(await names({ tier: 'layout' })).toEqual(['prose'])
    expect(await names({ category: 'overlays' })).toEqual(['dialog'])
    expect(await names({ tier: 'component', category: 'Actions', query: 'save' })).toEqual(['button'])
    expect((await data('mastercss_contract_list', { tier: 'layout' })).summary).toEqual({ libraries: 1, contracts: 3, returned: 1 })
  })

  it('returns a contract by its name or by any class it defines', async () => {
    const { data } = await connect(createWorkspace())
    const byClass = await data('mastercss_contract_get', { name: 'btn-primary' })
    expect(byClass).toMatchObject({ name: 'btn-primary', matched: 'class', source: { kind: 'project', file: 'ui/button.json' } })
    expect(byClass.contract.name).toBe('button')
    expect(byClass.contract.classes.map((entry: any) => entry.name)).toEqual(['btn', 'btn-primary', 'btn-ghost'])
    const byName = await data('mastercss_contract_get', { name: 'dialog' })
    expect(byName).toMatchObject({ matched: 'contract', source: { kind: 'package', package: 'fake-ui', version: '1.2.3' } })
    expect(byName.contract).toEqual(dialog)
  })

  it('answers an unknown name with the closest contract and class names', async () => {
    const { call } = await connect(createWorkspace())
    const response = await call('mastercss_contract_get', { name: 'btn-primery' })
    expect(response.isError).toBe(true)
    const { result, diagnostics } = response.structuredContent
    expect(result).toMatchObject({ status: 'error', error: { code: 'CONTRACT_NOT_FOUND' } })
    expect(result.error.message).toContain('Closest classes: btn-primary')
    expect(result.error.message).toContain('Closest contracts: ')
    expect(diagnostics.find((diagnostic: any) => diagnostic.message === 'Closest class names.').alternatives[0]).toBe('btn-primary')
    expect(diagnostics.find((diagnostic: any) => diagnostic.message === 'Closest contract names.').alternatives).toContain('button')
  })

  it('checks a buffer with the checker the library declares', async () => {
    const root = createWorkspace()
    const { data } = await connect(root)
    const broken = await data('mastercss_contract_check', { content: '<main>\n  <button class="btn-primary">Save</button><dialog class="dialog"></dialog>\n</main>', filePath: 'src/page.html' })
    expect(broken.checkers).toEqual([{ package: 'fake-ui', version: '1.2.3', contracts: 3 }])
    expect(broken.files).toEqual([{
      filePath: join(root, 'src/page.html'),
      diagnostics: [
        { code: 'missing-base', severity: 'error', message: 'btn-primary modifies btn.', line: 2, column: 3, className: 'btn-primary', contract: 'button', source: 'fake-ui' },
        { code: 'label', severity: 'error', message: 'dialog needs an accessible name.', line: 2, column: 44, className: 'dialog', contract: 'dialog', source: 'fake-ui' }
      ]
    }])
    expect(broken.summary).toEqual({ checkedFiles: 1, filesWithDiagnostics: 1, diagnostics: 2, errors: 2, warnings: 0 })
    expect(broken.coverage).toMatchObject({ status: 'complete', checkedFiles: [join(root, 'src/page.html')], skippedFiles: [] })

    // The project's own contract is the one the checker reads: btn-ghost exists only there.
    const clean = await data('mastercss_contract_check', { content: '<button class="btn btn-primary btn-ghost">Save</button><dialog class="dialog" aria-label="Confirm"></dialog>' })
    expect(clean.files).toEqual([])
    expect(clean.summary).toEqual({ checkedFiles: 1, filesWithDiagnostics: 0, diagnostics: 0, errors: 0, warnings: 0 })
    expect(clean.coverage).toMatchObject({ status: 'complete', checkedFiles: [join(root, 'index.html')] })
  })

  it('answers knows from the project manifest and is strict only then', async () => {
    const markup = '<p class="text text-center text-nope card-title">Hello</p>'
    const root = createWorkspace()
    const { data } = await connect(root)
    // No stylesheet entry: the checker is told nothing, so a utility also only looks like a contract class.
    const unaware = await data('mastercss_contract_check', { content: markup })
    expect(unaware).toMatchObject({ classValidation: 'none', strict: false })
    expect(unaware.note).toContain('project manifest could not be loaded')
    expect(unaware.files[0].diagnostics.map((diagnostic: any) => [diagnostic.className, diagnostic.severity])).toEqual([['text-center', 'warning'], ['text-nope', 'warning']])

    write(root, 'app.css', '@import "@master/css";\n@layer components { .text-lede { font-weight: 600 } }')
    const aware = await data('mastercss_contract_check', { content: `${markup}<p class="text text-lede"></p>` })
    expect(aware).toMatchObject({ classValidation: 'project-manifest', strict: true, manifest: { context: 'project', status: 'loaded' } })
    expect(aware.note).toBeUndefined()
    // text-center is a Master CSS utility and text-lede a native class of the project; text-nope is neither.
    expect(aware.files[0].diagnostics.map((diagnostic: any) => [diagnostic.className, diagnostic.severity])).toEqual([['text-nope', 'error']])
  })

  it('checks project files selected by patterns', async () => {
    const root = createWorkspace()
    write(root, 'src/good.html', '<button class="btn">Save</button>')
    write(root, 'src/bad.html', '<a class="btn-primary">Open</a>')
    write(root, 'src/other.txt', '<a class="btn-primary">Open</a>')
    const { data, call } = await connect(root)
    const report = await data('mastercss_contract_check', { patterns: ['src/*.html'] })
    expect(report.coverage.checkedFiles).toEqual([join(root, 'src/bad.html'), join(root, 'src/good.html')])
    expect(report.files.map((file: any) => file.filePath)).toEqual([join(root, 'src/bad.html')])
    expect(report.summary).toMatchObject({ checkedFiles: 2, filesWithDiagnostics: 1, diagnostics: 1, errors: 1 })
    // Without patterns the markup of the project is found, and never a dependency's.
    expect((await data('mastercss_contract_check')).coverage.checkedFiles).toEqual([join(root, 'src/bad.html'), join(root, 'src/good.html')])
    expect((await data('mastercss_contract_check', { patterns: ['src/*.vue'] })).coverage).toMatchObject({ status: 'no-inputs', checkedFiles: [] })
    const escaped = await call('mastercss_contract_check', { patterns: ['../outside.html'] })
    expect(escaped.isError).toBe(true)
    expect(escaped.structuredContent.result.error.message).toMatch(/escape/)
  })

  it('returns an empty list, not an error, when nothing declares contracts', async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-mcp-contracts-none-')))
    tempDirs.push(root)
    const { data, call } = await connect(root)
    const list = await data('mastercss_contract_list')
    expect(list).toMatchObject({ libraries: [], contracts: [], summary: { libraries: 0, contracts: 0, returned: 0 } })
    expect(list.note).toContain('masterCSS.contracts')
    const check = await data('mastercss_contract_check', { content: '<button class="btn-primary"></button>' })
    expect(check).toMatchObject({ checkers: [], files: [], coverage: { status: 'no-contracts', checkedFiles: [] } })
    expect(check.note).toContain('masterCSS.contracts')
    const missing = await call('mastercss_contract_get', { name: 'button' })
    expect(missing.isError).toBe(true)
    expect(missing.structuredContent.result.error).toMatchObject({ code: 'CONTRACT_NOT_FOUND' })
  })

  it('keeps lookups working when a library ships contracts without a checker', async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-mcp-contracts-plain-')))
    tempDirs.push(root)
    write(root, 'package.json', { devDependencies: { '@scope/ui': '*' } })
    write(root, 'node_modules/@scope/ui/package.json', { name: '@scope/ui', masterCSS: { contracts: './contracts.json' } })
    write(root, 'node_modules/@scope/ui/contracts.json', { contracts: [button] })
    const { data } = await connect(root)
    expect((await data('mastercss_contract_list')).libraries).toEqual([{ name: '@scope/ui', version: null, count: 1, checker: false }])
    expect((await data('mastercss_contract_get', { name: 'btn' })).source).toEqual({ kind: 'package', package: '@scope/ui', version: null })
    const check = await data('mastercss_contract_check', { content: '<button class="btn-primary"></button>' })
    expect(check).toMatchObject({ checkers: [], files: [], coverage: { status: 'no-checker', checkedFiles: [] } })
    expect(check.note).toContain('masterCSS.check')
  })

  it('never imports a checker or reads contracts from outside the declaring package', async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-mcp-contracts-escape-')))
    tempDirs.push(root)
    write(root, 'package.json', { dependencies: { 'escaping-ui': '*' }, masterCSS: { contracts: '../outside/*.json' } })
    write(root, 'node_modules/escaping-ui/package.json', { name: 'escaping-ui', version: '1.0.0', type: 'module', masterCSS: { contracts: ['./contracts.json', '../../secrets.json'], check: '../../checker.js' } })
    write(root, 'node_modules/escaping-ui/contracts.json', { contracts: [button] })
    write(root, 'secrets.json', { contracts: [dialog] })
    write(root, 'checker.js', 'globalThis.__contractCheckerEscaped = true\nexport const check = () => []\n')
    const { call, data } = await connect(root)
    const response = await call('mastercss_contract_list')
    expect(response.structuredContent.result.data.libraries).toEqual([{ name: 'escaping-ui', version: '1.0.0', count: 1, checker: false }])
    expect(response.structuredContent.result.data.contracts.map((contract: any) => contract.name)).toEqual(['button'])
    expect(response.structuredContent.diagnostics.map((diagnostic: any) => diagnostic.code).sort()).toEqual(['CONTRACT_CHECKER_UNRESOLVED', 'CONTRACT_FILE_UNREADABLE', 'CONTRACT_PATTERN_REJECTED'])
    expect((await data('mastercss_contract_check', { content: '<button class="btn-primary"></button>' })).coverage.status).toBe('no-checker')
    expect((globalThis as { __contractCheckerEscaped?: boolean }).__contractCheckerEscaped).toBeUndefined()
  })

  it('stops a checker that does not finish and keeps serving', async () => {
    const root = createWorkspace()
    write(root, 'node_modules/fake-ui/check/index.js', checker.replace('export function check(source, contracts, options = {}) {', 'export function check(source, contracts, options = {}) {\n  if (source.includes("hang")) for (;;) {}'))
    const { call, data } = await connect(root)
    const limits = { ...contractCheckerLimits }
    contractCheckerLimits.timeoutMs = 300
    try {
      const hung = await call('mastercss_contract_check', { content: '<p>hang</p>' })
      expect(hung.isError).toBe(true)
      expect(hung.structuredContent.result.error).toMatchObject({ code: 'CONTRACT_CHECKER_FAILED' })
      expect(hung.structuredContent.result.error.message).toContain('did not finish within 300 ms')
    } finally {
      Object.assign(contractCheckerLimits, limits)
    }
    expect((await data('mastercss_contract_check', { content: '<a class="btn-primary"></a>' })).summary.errors).toBe(1)
  })

  it('reports a checker that throws, prints or is replaced without a restart', async () => {
    const root = createWorkspace()
    write(root, 'node_modules/fake-ui/check/index.js', 'export function check() { console.log("noise"); throw new Error("broken rule") }\n')
    const { call, data } = await connect(root)
    const failed = await call('mastercss_contract_check', { content: '<a class="btn"></a>' })
    expect(failed.structuredContent.result.error).toMatchObject({ code: 'CONTRACT_CHECKER_FAILED' })
    expect(failed.structuredContent.result.error.message).toContain('broken rule')
    write(root, 'node_modules/fake-ui/check/index.js', 'export const check = () => [{ message: "upgraded", line: 1, column: 1 }]\n')
    expect((await data('mastercss_contract_check', { content: '<a class="btn"></a>' })).files[0].diagnostics[0].message).toBe('upgraded')
  })

  it('finds the libraries of a monorepo root and its peer dependencies', async () => {
    const repo = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-mcp-contracts-monorepo-')))
    tempDirs.push(repo)
    write(repo, 'package.json', { private: true, workspaces: ['apps/*'], peerDependencies: { 'fake-ui': '*' } })
    write(repo, 'node_modules/fake-ui/package.json', { name: 'fake-ui', version: '2.0.0', type: 'module', masterCSS: { contracts: './contracts.json', check: './check.js' } })
    write(repo, 'node_modules/fake-ui/contracts.json', { contracts: [button] })
    write(repo, 'node_modules/fake-ui/check.js', checker)
    write(repo, 'apps/web/package.json', { name: 'web', dependencies: { 'plain-lib': '*' } })
    const { data } = await connect(join(repo, 'apps/web'))
    expect((await data('mastercss_contract_list')).libraries).toEqual([{ name: 'fake-ui', version: '2.0.0', count: 1, checker: true }])
    expect((await data('mastercss_contract_check', { content: '<a class="btn-primary"></a>' })).summary.errors).toBe(1)

    // A root inside its own repository does not look above it.
    write(repo, 'apps/web/.git/HEAD', 'ref: refs/heads/main\n')
    expect((await data('mastercss_contract_list')).libraries).toEqual([])
  })

  it('checks a library in its own repository with the checker it declares', async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-mcp-contracts-own-')))
    tempDirs.push(root)
    write(root, 'package.json', { name: '@scope/ui', version: '0.1.0', type: 'module', masterCSS: { contracts: './dist/contracts.json', check: './check/index.js' } })
    write(root, 'dist/contracts.json', { contracts: [button, dialog] })
    write(root, 'check/index.js', checker)
    const { data } = await connect(root)
    const list = await data('mastercss_contract_list')
    expect(list.libraries).toEqual([{ name: '@scope/ui', version: '0.1.0', count: 2, checker: true }])
    expect(list.contracts[0].source).toEqual({ kind: 'project', file: 'dist/contracts.json' })
    const report = await data('mastercss_contract_check', { content: '<dialog class="dialog"></dialog>' })
    expect(report.checkers).toEqual([{ package: '@scope/ui', version: '0.1.0', contracts: 2 }])
    expect(report.files[0].diagnostics.map((diagnostic: any) => diagnostic.code)).toEqual(['label'])
  })
})
