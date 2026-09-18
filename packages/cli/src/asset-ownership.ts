import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { publishStylesheet, replaceStylesheetFile, resolveEntryTarget } from './publication'

// Retain the previous successful generation regardless of its age, and all
// other generations for at least a day after they stop being current.
export const ASSET_RETENTION_MS = 24 * 60 * 60 * 1000
const suffix = '.master-css.json'
const digest = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex')
interface Identity { dev: string, ino: string, birthtimeNs: string, mtimeNs: string, mode: string }
interface OwnedAsset extends Identity { hash: string, createdAt: number }
interface Generation { hash: string, assets: string[] }
interface State {
  version: 1
  entry: string
  current?: Generation
  retained: (Generation & { retiredAt: number })[]
  owned: Record<string, OwnedAsset>
  pending?: { generation: Generation, entryIdentity: Identity, entryTemporary: string, temporaries: Record<string, Identity> }
}

export const stylesheetStatePath = (entry: string) => path.join(path.dirname(entry), `.${path.basename(entry)}${suffix}`)
const name = (value: unknown): value is string => typeof value === 'string' && value !== '.' && value !== '..'
  && value.length > 0 && !/[\\/\0]/.test(value)
const assetName = (value: unknown): value is string => name(value) && /^master-[a-f0-9]+-/.test(value)
const hash = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const timestamp = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value)
const identityKeys = ['dev', 'ino', 'birthtimeNs', 'mtimeNs', 'mode'] as const
const temporaryName = (value: unknown): value is string => typeof value === 'string' && /^\.master-css-[a-f0-9-]+\.tmp$/.test(value)
const validIdentity = (value: unknown) => object(value) && identityKeys.every(key => typeof value[key] === 'string' && /^\d+$/.test(value[key]))
const generation = (value: unknown) => object(value) && hash(value.hash) && Array.isArray(value.assets) && value.assets.every(assetName)

function identity(file: string): Identity | undefined {
  const stat = fs.lstatSync(file, { bigint: true, throwIfNoEntry: false })
  if (!stat?.isFile()) return undefined
  return { dev: String(stat.dev), ino: String(stat.ino), birthtimeNs: String(stat.birthtimeNs), mtimeNs: String(stat.mtimeNs), mode: String(stat.mode & 0o777n) }
}

function sameIdentity(left: Identity | undefined, right: Identity) {
  return left && identityKeys.every(key => left[key] === right[key])
}

function readState(file: string, entry?: string): State | undefined {
  const stat = fs.lstatSync(file, { throwIfNoEntry: false })
  if (!stat) return undefined
  if (!stat.isFile()) throw new Error(`Invalid stylesheet ownership file: ${file}`)
  const value: unknown = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!object(value) || value.version !== 1 || !name(value.entry) || (entry !== undefined && value.entry !== entry)
    || (value.current !== undefined && !generation(value.current))
    || !Array.isArray(value.retained) || !value.retained.every(item => generation(item) && timestamp(item.retiredAt))
    || !object(value.owned) || !Object.entries(value.owned).every(([file, item]) => assetName(file) && validIdentity(item) && object(item) && hash(item.hash) && timestamp(item.createdAt))
    || (value.pending !== undefined && (!object(value.pending) || !generation(value.pending.generation) || !validIdentity(value.pending.entryIdentity)
      || !temporaryName(value.pending.entryTemporary) || !object(value.pending.temporaries)
      || !Object.entries(value.pending.temporaries).every(([file, item]) => temporaryName(file) && validIdentity(item))))) {
    throw new Error(`Invalid stylesheet ownership file: ${file}`)
  }
  return value as unknown as State
}

function promote(state: State, next: Generation, now: number) {
  if (state.current && (state.current.hash !== next.hash || JSON.stringify(state.current.assets) !== JSON.stringify(next.assets))) {
    state.retained.unshift({ ...state.current, retiredAt: now })
  }
  state.current = next
  delete state.pending
}

function referenced(state: State) {
  return [state.current, ...state.retained, state.pending?.generation].flatMap(item => item?.assets ?? [])
}

/** Called inside the cooperating CLI publication gate. */
export function publishOwnedStylesheet(entry: string, css: string, assets: ReadonlyMap<string, Buffer>, outputFiles: Set<string>, now = Date.now()) {
  entry = path.resolve(entry)
  const directory = path.dirname(entry)
  const stateFile = stylesheetStatePath(entry)
  outputFiles.add(stateFile)
  const state = readState(stateFile, path.basename(entry)) ?? { version: 1, entry: path.basename(entry), retained: [], owned: {} }
  const save = () => {
    const stat = fs.lstatSync(stateFile, { throwIfNoEntry: false })
    if (stat) {
      if (!stat.isFile()) throw new Error(`Invalid stylesheet ownership file: ${stateFile}`)
      fs.accessSync(stateFile, fs.constants.W_OK)
    }
    replaceStylesheetFile(stateFile, Buffer.from(JSON.stringify(state, null, 2) + '\n'), outputFiles, 0o600)
  }
  const target = resolveEntryTarget(entry)
  if (state.pending) {
    const entryTemporary = path.join(path.dirname(target), state.pending.entryTemporary)
    if (sameIdentity(identity(entryTemporary), state.pending.entryIdentity)) fs.unlinkSync(entryTemporary)
    for (const [file, expected] of Object.entries(state.pending.temporaries)) {
      const temporary = path.join(directory, file)
      if (sameIdentity(identity(temporary), expected)) fs.unlinkSync(temporary)
    }
    if (sameIdentity(identity(target), state.pending.entryIdentity) && digest(fs.readFileSync(target)) === state.pending.generation.hash) {
      promote(state, state.pending.generation, now)
    } else delete state.pending
    save()
  }
  const names = [...assets.keys()].map(file => {
    if (path.dirname(file) !== directory || !assetName(path.basename(file))) throw new Error(`Invalid stylesheet asset path: ${file}`)
    outputFiles.add(file)
    return path.basename(file)
  }).sort()
  const next: Generation = { hash: digest(css), assets: names }
  const unchanged = state.current?.hash === next.hash && JSON.stringify(state.current.assets) === JSON.stringify(names)
    && fs.existsSync(target) && digest(fs.readFileSync(target)) === next.hash
    && [...assets].every(([file, bytes]) => identity(file) && fs.readFileSync(file).equals(bytes))
  if (!unchanged) {
    publishStylesheet(entry, css, assets, outputFiles, {
      beforePublish(created, temporary) {
        for (const [file, prepared] of created) {
          state.owned[path.basename(file)] = { ...identity(prepared)!, hash: digest(assets.get(file)!), createdAt: now }
        }
        // Prepared file identities prove creation even if the process dies
        // between publishing a hard link and updating the ownership journal.
        state.pending = {
          generation: next,
          entryIdentity: identity(temporary)!,
          entryTemporary: path.basename(temporary),
          temporaries: Object.fromEntries([...created.values()].map(file => [path.basename(file), identity(file)!]))
        }
        save()
      },
      afterPublish() {
        promote(state, next, now)
        save()
      }
    })
  }
  const beforeCleanup = JSON.stringify(state)
  // Keep the most recent previous generation even when it is older than a day.
  state.retained = state.retained.filter((item, index) => index === 0 || now - item.retiredAt < ASSET_RETENTION_MS)
  const protectedFiles = new Set(referenced(state))
  try {
    // Borrowing another output's existing bytes does not grant ownership, but
    // its journal still pins those bytes while that output needs them.
    for (const file of fs.readdirSync(directory)) {
      if (!file.startsWith('.') || !file.endsWith(suffix) || path.join(directory, file) === stateFile) continue
      const other = readState(path.join(directory, file))
      if (other) for (const asset of referenced(other)) protectedFiles.add(asset)
    }
    for (const [file, owned] of Object.entries(state.owned)) {
      const target = path.join(directory, file)
      if (!sameIdentity(identity(target), owned) || digest(fs.readFileSync(target)) !== owned.hash) {
        // Missing, replaced, touched or modified files cease to be ours.
        delete state.owned[file]
      } else if (!protectedFiles.has(file) && now - owned.createdAt >= ASSET_RETENTION_MS) {
        fs.unlinkSync(target)
        delete state.owned[file]
      }
    }
    if (JSON.stringify(state) !== beforeCleanup) save()
  } catch (error) {
    // Publication has succeeded. Leave retryable cleanup debt without turning
    // valid output into a failed export or deleting unverified files.
    process.stderr.write(`Cannot clean stylesheet assets: ${error}\n`)
  }
}
