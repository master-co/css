import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { API } from 'typescript/unstable/sync'
import { createVirtualFileSystem } from 'typescript/unstable/fs'
import getTypeScriptExecutable from '../node_modules/typescript/lib/getExePath.js'

// The native TS API sends slash-normalized paths to filesystem callbacks.
const apiPath = file => resolve(file).replaceAll('\\', '/')

/** Repository tooling only. The native API is pinned with TypeScript itself. */
export function openTypeScriptProject(files, { configFile, compilerOptions = {}, overlays = {} } = {}) {
  const directory = join(realpathSync.native(tmpdir()), 'master-css-typescript-api')
  const config = apiPath(join(directory, 'tsconfig.json'))
  const virtualFiles = {
    ...Object.fromEntries(Object.entries(overlays).map(([file, text]) => [apiPath(file), text])),
    [config]: JSON.stringify({
      ...(configFile ? { extends: apiPath(configFile) } : {}),
      compilerOptions: { target: 'ESNext', module: 'ESNext', moduleResolution: 'Bundler', skipLibCheck: true, noEmit: true, ...compilerOptions },
      files: files.map(apiPath),
      include: [],
      exclude: []
    })
  }
  const virtualFS = createVirtualFileSystem(virtualFiles)
  const api = new API({ cwd: process.cwd(), fs: {
    readFile: file => virtualFS.readFile(apiPath(file)),
    fileExists: file => virtualFS.fileExists(apiPath(file)) || undefined,
    directoryExists: directory => virtualFS.directoryExists(apiPath(directory)) || undefined
  } })
  try {
    const snapshot = api.updateSnapshot({ openProjects: [config] })
    const project = snapshot.getProject(config)
    if (!project) throw new Error(`Unable to open TypeScript project ${config}`)
    return {
      ...project,
      sourceFile(file) {
        const source = project.program.getSourceFile(apiPath(file))
        if (!source) throw new Error(`Unable to parse TypeScript source ${file}`)
        return source
      },
      close() { snapshot.dispose(); api.close() }
    }
  } catch (error) { api.close(); throw error }
}

export function parseTypeScript(file, text = readFileSync(file, 'utf8')) {
  const session = openTypeScriptProject([file], { compilerOptions: { allowJs: true }, overlays: { [file]: text } })
  try {
    return { sourceFile: session.sourceFile(file), diagnostics: session.program.getSyntacticDiagnostics(apiPath(file)) }
  } finally { session.close() }
}

export function visitTypeScript(node, callback) {
  callback(node)
  node.forEachChild(child => visitTypeScript(child, callback))
}

export function formatTypeScriptDiagnostics(diagnostics) {
  return diagnostics.map(diagnostic => diagnostic.message ?? diagnostic.messageText ?? String(diagnostic)).join('\n')
}

/** Compile test specimens with the same TS7 compiler used by package builds. */
export function compileTypeScript(source, { fileName = 'specimen.tsx', compilerOptions = {} } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'master-css-typescript-emit-'))
  try {
    const file = join(directory, fileName)
    writeFileSync(file, source)
    const config = join(directory, 'tsconfig.json')
    writeFileSync(config, JSON.stringify({
      compilerOptions: { target: 'ES2022', module: 'CommonJS', jsx: 'react-jsx', noCheck: true, outDir: join(directory, 'out'), ...compilerOptions },
      files: [file]
    }))
    const result = spawnSync(getTypeScriptExecutable(), ['-p', config], { encoding: 'utf8' })
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error(result.stdout + result.stderr)
    const diagnostics = parseTypeScript(file, source).diagnostics
    const outputText = readFileSync(join(directory, 'out', fileName.replace(/\.[cm]?tsx?$/, '.js')), 'utf8')
    return { outputText, diagnostics }
  } finally { rmSync(directory, { recursive: true, force: true }) }
}

export { getTypeScriptExecutable }
