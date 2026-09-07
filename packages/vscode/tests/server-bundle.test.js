import { spawn } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import {
  createStagedExtension,
  getCurrentTarget,
  getRuntimePackagesForTarget
} from '../scripts/package-target-core.js'

const here = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(here, '..')
const distDir = resolve(packageDir, 'dist')
const serverPath = resolve(distDir, 'server.min.js')
const extensionPath = resolve(distDir, 'extension.min.js')
const sourceGrammarPath = './node_modules/@master/css-language-service/syntaxes/master-css.tmLanguage.json'
const stagedGrammarPath = './dist/node_modules/@master/css-language-service/syntaxes/master-css.tmLanguage.json'

function readPackageJSON(path = resolve(packageDir, 'package.json')) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function encode(message) {
  const body = Buffer.from(JSON.stringify(message))
  return Buffer.concat([
    Buffer.from(`Content-Length: ${body.length}\r\n\r\n`),
    body
  ])
}

function createLanguageServer(options = {}) {
  const child = spawn(process.execPath, [options.serverPath ?? serverPath, '--stdio'], {
    cwd: options.cwd ?? packageDir,
    env: {
      ...process.env,
      NODE_PATH: ''
    },
    stdio: ['pipe', 'pipe', 'pipe']
  })
  let closed = false
  let disposed = false
  let nextId = 1
  let stdout = Buffer.alloc(0)
  const stderr = []
  const pending = new Map()
  const closedPromise = new Promise((resolvePromise) => {
    child.on('close', (code) => {
      closed = true
      if (!disposed) {
        rejectAll(new Error(`Language server exited with code ${code}\n${stderr.join('')}`))
      }
      resolvePromise(code)
    })
  })

  function rejectAll(error) {
    for (const request of pending.values()) {
      clearTimeout(request.timer)
      request.reject(error)
    }
    pending.clear()
  }

  function handleMessage(message) {
    if (Object.hasOwn(message, 'id') && pending.has(message.id)) {
      const request = pending.get(message.id)
      pending.delete(message.id)
      clearTimeout(request.timer)
      if (message.error) {
        request.reject(new Error(message.error.message))
      } else {
        request.resolve(message.result)
      }
      return
    }
  }

  child.stdout.on('data', (chunk) => {
    stdout = Buffer.concat([stdout, chunk])
    while (true) {
      const headerEnd = stdout.indexOf('\r\n\r\n')
      if (headerEnd === -1) return
      const header = stdout.subarray(0, headerEnd).toString()
      const lengthMatch = header.match(/Content-Length: (\d+)/i)
      expect(lengthMatch, `Invalid LSP header: ${header}`).toBeTruthy()
      const bodyStart = headerEnd + 4
      const bodyEnd = bodyStart + Number(lengthMatch[1])
      if (stdout.length < bodyEnd) return
      const body = stdout.subarray(bodyStart, bodyEnd).toString()
      stdout = stdout.subarray(bodyEnd)
      handleMessage(JSON.parse(body))
    }
  })

  child.stderr.on('data', (chunk) => {
    stderr.push(chunk.toString())
  })

  child.on('error', (error) => {
    if (!disposed) rejectAll(error)
  })

  function write(message) {
    child.stdin.write(encode(message))
  }

  return {
    request(method, params) {
      const id = nextId++
      write({
        jsonrpc: '2.0',
        id,
        method,
        params
      })
      return new Promise((resolvePromise, rejectPromise) => {
        const timer = setTimeout(() => {
          pending.delete(id)
          rejectPromise(new Error(`Timed out waiting for ${method}\n${stderr.join('')}`))
        }, 5000)
        pending.set(id, {
          resolve: resolvePromise,
          reject: rejectPromise,
          timer
        })
      })
    },
    notify(method, params) {
      write({
        jsonrpc: '2.0',
        method,
        params
      })
    },
    stderr() {
      return stderr.join('')
    },
    closed: () => closedPromise,
    async dispose() {
      disposed = true
      if (!child.stdin.destroyed && !child.stdin.writableEnded) {
        child.stdin.end()
      }
      if (!closed) {
        child.kill()
      }
      await closedPromise
    }
  }
}

async function withStagedExtension(callback, options = {}) {
  const stagingRoot = await mkdtemp(join(tmpdir(), 'master-css-vscode-test-'))
  try {
    const target = options.target ?? getCurrentTarget()
    return await callback(
      await createStagedExtension(target, { stagingRoot, publisher: options.publisher }),
      { getCurrentTarget, getRuntimePackagesForTarget }
    )
  } finally {
    await rm(stagingRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
  }
}

function expectStagedRuntimePackages({ stagingDir, files }, runtimePackages) {
  for (const runtimePackage of runtimePackages) {
    const packagePath = join(stagingDir, 'dist', 'node_modules', ...runtimePackage.split('/'))
    expect(statSync(packagePath).isDirectory(), runtimePackage).toBe(true)
    expect(files).toContain(`dist/node_modules/${runtimePackage}/**`)
  }
}

function expectCurrentNativeArtifacts(stagingDir, target) {
  const packageName = getRuntimePackagesForTarget(target)[0]
  const packagePath = join(stagingDir, 'dist', 'node_modules', ...packageName.split('/'))
  const executableName = target.startsWith('win32-') ? 'mcss.exe' : 'mcss'
  expect(statSync(join(packagePath, 'mastercss.node')).isFile()).toBe(true)
  expect(statSync(join(packagePath, executableName)).isFile()).toBe(true)
}

test('build emits the server bundle', () => {
  expect(statSync(serverPath).isFile()).toBe(true)
})

test('extension bundle keeps vscode external without default import interop', () => {
  const source = readFileSync(extensionPath, 'utf8')

  expect(statSync(extensionPath).isFile()).toBe(true)
  expect(source).toMatch(/\bfrom\s*["']vscode["']/)
  expect(source).not.toMatch(/import\s+[A-Za-z_$][\w$]*\s*,\s*\{[^}]*\}\s*from\s*["']vscode["']/)
  expect(source).not.toMatch(/import\s+[A-Za-z_$][\w$]*\s*from\s*["']vscode["']/)
})

test('extension bundle includes workspace language server resolution fallback', () => {
  const source = readFileSync(extensionPath, 'utf8')

  expect(source).toContain('@master/css-language-server/server')
  expect(source).toContain('Using workspace language server')
  expect(source).toContain('Using bundled language server')
})

test('extension bundle reuses one Master CSS output channel for the language client', () => {
  const source = readFileSync(extensionPath, 'utf8')
  const masterCSSOutputChannelCalls = source.match(/\.createOutputChannel\((?:`Master CSS`|"Master CSS"|'Master CSS')/g) ?? []
  const languageClientConstruction = source.match(
    /new\s+[A-Za-z_$][\w$]*\.LanguageClient\(\s*(?:`masterCSS`|"masterCSS"|'masterCSS')\s*,\s*(?:`Master CSS`|"Master CSS"|'Master CSS')[\s\S]*?\}\)/
  )?.[0]

  expect(masterCSSOutputChannelCalls).toHaveLength(1)
  expect(languageClientConstruction).toContain('outputChannel:')
})

test('server bundle does not retain removed TypeScript semantic bindings', () => {
  const source = readFileSync(serverPath, 'utf8')
  const imports = [...source.matchAll(/\bfrom\s*["']([^"']+)["']/g)].map((match) => match[1])
  const legacySemanticImports = imports.filter((specifier) =>
    /^(?:lightningcss(?:-.+)?|oxc-(?:parser|resolver|transform)|@oxc-(?:parser|resolver|transform)\/)/.test(specifier)
  )

  expect(legacySemanticImports).toEqual([])
})

test('records the rc.87 native semantic import externalization divergence', () => {
  const source = readFileSync(serverPath, 'utf8')
  const imports = [...source.matchAll(/\bfrom\s*["']([^"']+)["']/g)].map((match) => match[1])
  const legacySemanticImports = imports.filter((specifier) =>
    /^(?:lightningcss(?:-.+)?|oxc-(?:parser|resolver|transform)|@oxc-(?:parser|resolver|transform)\/)/.test(specifier)
  )

  expect(legacySemanticImports).toEqual([])
})

test('server bundle embeds referenced MDN JSON modules', () => {
  const source = readFileSync(serverPath, 'utf8')
  const imports = [...source.matchAll(/\bfrom\s*["']([^"']+)["']/g)].map((match) => match[1])

  expect(imports.filter((specifier) => specifier.startsWith('mdn-data/'))).toEqual([])
  expect(source).not.toContain('../data/patch.json')
  expect(source).not.toContain('mdn-data/css/')
  expect(source).toContain('repeating-linear-gradient()')
  expect(source).toContain(':first-child')
})

test('staged extension includes runtime packages for the current target', async () => {
  await withStagedExtension(({ stagingDir, files, target }, { getCurrentTarget, getRuntimePackagesForTarget }) => {
    expectStagedRuntimePackages({ stagingDir, files }, getRuntimePackagesForTarget(getCurrentTarget()))
    expectCurrentNativeArtifacts(stagingDir, target)
  })
})

test('staged extension includes runtime packages for win32-x64', async () => {
  await withStagedExtension(({ stagingDir, files }, { getRuntimePackagesForTarget }) => {
    expectStagedRuntimePackages({ stagingDir, files }, getRuntimePackagesForTarget('win32-x64'))
  }, { target: 'win32-x64' })
})

test('staged extension preserves the Marketplace publisher by default', async () => {
  await withStagedExtension(({ stagingDir }) => {
    expect(readPackageJSON().publisher).toBe('masterco')
    expect(readPackageJSON(join(stagingDir, 'package.json')).publisher).toBe('masterco')
  })
})

test('staged extension supports an Open VSX publisher override', async () => {
  await withStagedExtension(({ stagingDir }) => {
    expect(readPackageJSON().publisher).toBe('masterco')
    expect(readPackageJSON(join(stagingDir, 'package.json')).publisher).toBe('master')
  }, { publisher: 'master' })
})

test('staged extension rejects unsupported targets', async () => {
  await expect(createStagedExtension('unsupported-target', { stagingRoot: tmpdir() }))
    .rejects
    .toThrow('Unsupported VS Code target "unsupported-target"')
})

test('manifest contributes TextMate grammar, semantic token scopes, and CSS diagnostic defaults', () => {
  const packageJSON = readPackageJSON()

  expect(packageJSON.contributes.languages).toBeUndefined()
  expect(packageJSON.contributes.css).toBeUndefined()
  expect(packageJSON.contributes.grammars).toEqual([
    {
      scopeName: 'master-css.directive.injection',
      path: sourceGrammarPath,
      injectTo: [
        'source.css',
        'source.css.scss',
        'source.css.less',
        'source.css.postcss'
      ]
    }
  ])
  expect(packageJSON.contributes.configurationDefaults).toEqual({
    'css.lint.unknownAtRules': 'ignore',
    'scss.lint.unknownAtRules': 'ignore',
    'less.lint.unknownAtRules': 'ignore'
  })
  expect(packageJSON.contributes.semanticTokenScopes).toEqual([
    {
      scopes: expect.objectContaining({
        class: expect.arrayContaining(['entity.other.attribute-name.class.css']),
        'operator.declarationTerminator': expect.arrayContaining(['punctuation.terminator.rule.css']),
        'operator.declarationSeparator': expect.arrayContaining(['punctuation.separator.key-value.css']),
        'operator.selectorCombinator': expect.arrayContaining(['keyword.operator.combinator.css']),
        'operator.functionPunctuation': expect.arrayContaining(['punctuation.section.function.begin.bracket.round.css'])
      })
    }
  ])
  expect(packageJSON.contributes.semanticTokenModifiers).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'blockBrace' }),
    expect.objectContaining({ id: 'declarationSeparator' }),
    expect.objectContaining({ id: 'declarationTerminator' }),
    expect.objectContaining({ id: 'selectorCombinator' }),
    expect.objectContaining({ id: 'pseudoClassDelimiter' })
  ]))
  expect(packageJSON.contributes.configuration.properties['masterCSS.includedLanguages'].default).toEqual(expect.arrayContaining([
    'css',
    'scss',
    'less'
  ]))
  expect(packageJSON.contributes.configuration.properties['masterCSS.formatDirectives']).toMatchObject({
    type: 'boolean',
    default: true
  })
})

test('staged extension includes shared TextMate grammar asset', async () => {
  await withStagedExtension(({ stagingDir, files }) => {
    const syntaxPath = join(stagingDir, ...stagedGrammarPath.slice(2).split('/'))
    const stagedPackageJSON = readPackageJSON(join(stagingDir, 'package.json'))

    expect(statSync(syntaxPath).isFile()).toBe(true)
    expect(files).toContain(stagedGrammarPath.slice(2))
    expect(stagedPackageJSON.contributes.grammars[0].path).toBe(stagedGrammarPath)
  })
})

test('staged language server starts without workspace node_modules and shuts down', async () => {
  await withStagedExtension(async ({ stagingDir }) => {
    const server = createLanguageServer({
      cwd: stagingDir,
      serverPath: resolve(stagingDir, 'dist', 'server.min.js')
    })

    try {
      const result = await server.request('initialize', {
        processId: null,
        rootUri: null,
        capabilities: {
          workspace: {
            workspaceFolders: true
          }
        },
        workspaceFolders: []
      })

      expect(result.capabilities?.textDocumentSync).toBeTruthy()
      expect(result.capabilities?.hoverProvider).toBe(true)

      await server.request('shutdown', null)
      server.notify('exit')
      await expect(server.closed()).resolves.toBe(0)

      expect(server.stderr()).not.toContain('Cannot find module')
      expect(server.stderr()).not.toContain('Cannot find package')
    } finally {
      await server.dispose()
    }
  })
})

test('proves the rc.87 staged language server lifecycle without workspace node_modules', async () => {
  await withStagedExtension(async ({ stagingDir }) => {
    const server = createLanguageServer({
      cwd: stagingDir,
      serverPath: resolve(stagingDir, 'dist', 'server.min.js')
    })

    try {
      const result = await server.request('initialize', {
        processId: null,
        rootUri: null,
        capabilities: {
          workspace: {
            workspaceFolders: true
          }
        },
        workspaceFolders: []
      })

      expect(result.capabilities?.textDocumentSync).toBeTruthy()
      expect(result.capabilities?.hoverProvider).toBe(true)

      await server.request('shutdown', null)
      server.notify('exit')
      await expect(server.closed()).resolves.toBe(0)

      expect(server.stderr()).not.toContain('Cannot find module')
      expect(server.stderr()).not.toContain('Cannot find package')
    } finally {
      await server.dispose()
    }
  })
})
