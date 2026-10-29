import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, extname, join, parse, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { getTypeScriptExecutable, openTypeScriptProject } from './typescript-api.mjs'

function commonDirectory(files) {
  let root = dirname(resolve(files[0]))
  for (const file of files) {
    while (relative(root, resolve(file)).split(/[\\/]/)[0] === '..') {
      const parent = dirname(root)
      if (parent === root) throw new Error('TypeScript sources must share a filesystem root.')
      root = parent
    }
  }
  return root
}

export function typeScriptSourceRoot(configFile) {
  if (!existsSync(configFile)) configFile = resolve(dirname(configFile), 'tsconfig.json')
  const result = spawnSync(getTypeScriptExecutable(), ['-p', configFile, '--rootDir', parse(resolve(configFile)).root, '--listFilesOnly'], { encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(result.stdout + result.stderr)
  const files = result.stdout.trim().split(/\r?\n/).filter(file => file && !file.includes('node_modules') && !/\.d\.[cm]?ts$/.test(file))
  return commonDirectory(files.length ? files : [resolve(dirname(configFile), 'src/index.ts')])
}

/** Read published declarations directly; compile source-only fixtures into a disposable tree. */
export function openDeclarationProject(files, options = {}) {
  files = files.map(file => resolve(file))
  let temporaryDirectory
  let session
  const mappedFiles = new Map(files.map(file => [file, file]))
  try {
    if (files.some(file => !/\.d\.[cm]?ts$/.test(file))) {
      temporaryDirectory = mkdtempSync(join(tmpdir(), 'master-css-declarations-'))
      const config = join(temporaryDirectory, 'tsconfig.json')
      const rootDir = commonDirectory(files)
      const outDir = join(temporaryDirectory, 'out')
      writeFileSync(config, JSON.stringify({
        compilerOptions: { target: 'ESNext', module: 'ESNext', moduleResolution: 'Bundler', strict: true, skipLibCheck: true, ...options,
          rootDir, outDir, declarationDir: outDir, noEmit: false, declaration: true, emitDeclarationOnly: true, noCheck: true, incremental: false },
        files
      }))
      const result = spawnSync(getTypeScriptExecutable(), ['-p', config], { encoding: 'utf8' })
      if (result.error) throw result.error
      if (result.status !== 0) throw new Error(result.stdout + result.stderr)
      for (const file of files) {
        if (!/\.d\.[cm]?ts$/.test(file)) mappedFiles.set(file, join(outDir, relative(rootDir, file).replace(/\.[^.]+$/, extname(file) === '.mts' ? '.d.mts' : extname(file) === '.cts' ? '.d.cts' : '.d.ts')))
      }
    }
    session = openTypeScriptProject([...mappedFiles.values()], { compilerOptions: { ...options, paths: {} } })
    return {
      ...session,
      sourceFile(file) { return session.sourceFile(mappedFiles.get(resolve(file)) || resolve(file)) },
      close() {
        session.close()
        if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true })
      }
    }
  } catch (error) {
    session?.close()
    if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true })
    throw error
  }
}

export function nativeDeclarationOptions(configFile) {
  return {
    generator: /** @type {const} */ ('tsgo'),
    tsgo: { path: getTypeScriptExecutable(), rootDir: typeScriptSourceRoot(resolve(configFile)) }
  }
}
