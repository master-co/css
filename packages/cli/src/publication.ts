import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

function matchesAsset(file: string, bytes: Buffer) {
  const stat = fs.lstatSync(file, { throwIfNoEntry: false })
  if (!stat) return false
  if (!stat.isFile() || !fs.readFileSync(file).equals(bytes)) {
    throw new Error(`Refusing to overwrite stylesheet asset: ${file}`)
  }
  return true
}

function prepareTemporaryFile(target: string, bytes: Buffer, outputFiles: Set<string>, mode?: number) {
  const temporary = path.join(path.dirname(target), `.master-css-${randomUUID()}.tmp`)
  let descriptor: number | undefined
  let created = false
  outputFiles.add(temporary)
  try {
    descriptor = fs.openSync(temporary, 'wx', mode ?? 0o666)
    created = true
    if (mode !== undefined) fs.fchmodSync(descriptor, mode)
    fs.writeFileSync(descriptor, bytes)
    fs.closeSync(descriptor)
    descriptor = undefined
    return temporary
  } catch (error) {
    if (descriptor !== undefined) { fs.closeSync(descriptor); descriptor = undefined }
    if (created) fs.rmSync(temporary, { force: true })
    outputFiles.delete(temporary)
    throw error
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor)
  }
}

function removeTemporaryFile(file: string, outputFiles: Set<string>) {
  try { fs.rmSync(file, { force: true }) } finally { outputFiles.delete(file) }
}

export function replaceStylesheetFile(file: string, bytes: Buffer, outputFiles: Set<string>, mode?: number) {
  const temporary = prepareTemporaryFile(file, bytes, outputFiles, mode)
  try { fs.renameSync(temporary, file) } finally { removeTemporaryFile(temporary, outputFiles) }
}

export function resolveEntryTarget(file: string) {
  // Preserve an existing output symlink, including a dangling link to a file.
  for (let depth = 0; depth < 40; depth++) {
    const stat = fs.lstatSync(file, { throwIfNoEntry: false })
    if (!stat?.isSymbolicLink()) return file
    file = path.resolve(path.dirname(file), fs.readlinkSync(file))
  }
  throw new Error('Too many symbolic links in stylesheet output path')
}

/** Publish immutable sidecars completely before atomically replacing the entry. */
export function publishStylesheet(entry: string, css: string, assets: ReadonlyMap<string, Buffer>, outputFiles: Set<string>, journal?: {
  beforePublish: (newAssets: ReadonlyMap<string, string>, entryTemporary: string) => void
  afterPublish: () => void
}) {
  fs.mkdirSync(path.dirname(entry), { recursive: true })
  const target = resolveEntryTarget(entry)
  const previous = fs.statSync(target, { throwIfNoEntry: false })
  if (previous) {
    if (!previous.isFile()) throw new Error(`Stylesheet output is not a file: ${target}`)
    fs.accessSync(target, fs.constants.W_OK)
  }
  outputFiles.add(target)
  for (const [file, bytes] of assets) {
    outputFiles.add(file)
    if (file === target || file === entry) throw new Error(`Stylesheet asset collides with output: ${file}`)
    // Validate collisions before creating any files for this publication.
    matchesAsset(file, bytes)
  }
  const prepared = new Map<string, string>()
  let entryTemporary: string | undefined
  try {
    for (const [file, bytes] of assets) {
      if (!matchesAsset(file, bytes)) prepared.set(file, prepareTemporaryFile(file, bytes, outputFiles))
    }
    entryTemporary = prepareTemporaryFile(target, Buffer.from(css), outputFiles, previous ? previous.mode & 0o777 : undefined)
    // Ownership must be recoverable before the first new asset becomes visible.
    journal?.beforePublish(prepared, entryTemporary)
    for (const [file, temporary] of prepared) {
      try {
        // A hard link publishes complete bytes without replacing an existing file.
        fs.linkSync(temporary, file)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || !matchesAsset(file, assets.get(file)!)) throw error
      }
    }
    fs.renameSync(entryTemporary, target)
    journal?.afterPublish()
  } finally {
    for (const temporary of prepared.values()) removeTemporaryFile(temporary, outputFiles)
    if (entryTemporary) removeTemporaryFile(entryTemporary, outputFiles)
  }
}
