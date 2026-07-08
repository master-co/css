import { execFile, spawn } from 'node:child_process'
import { readdir, readFile, rm, mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { measureArtifact } from './bytes'
import type { BenchmarkArtifact } from './types'

const execFileAsync = promisify(execFile)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const benchmarkRoot = resolve(__dirname, '..')
export const repoRoot = resolve(benchmarkRoot, '..')

export interface CommandRunResult {
  elapsedMs: number
  stdout: string
  stderr: string
}

export interface CommandRunOptions {
  env?: NodeJS.ProcessEnv
  timeoutMs?: number
}

export interface CommandStreamOptions extends CommandRunOptions {
  stdout?: (chunk: string) => void
  stderr?: (chunk: string) => void
}

export async function resetDirectory(path: string) {
  await rm(path, { recursive: true, force: true })
  await mkdir(path, { recursive: true })
}

export async function writeWorkspaceFiles(root: string, files: Record<string, string>) {
  await Promise.all(Object.entries(files).map(async ([name, content]) => {
    const file = resolve(root, name)
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, content)
  }))
}

export function resolveBenchmarkPackageFile(packageName: string, file: string) {
  return resolve(benchmarkRoot, 'node_modules', ...packageName.split('/'), file)
}

export async function runCommand(command: string, args: string[], cwd: string, options: CommandRunOptions = {}): Promise<CommandRunResult> {
  const startedAt = performance.now()

  try {
    const result = await execFileAsync(command, args, {
      cwd,
      env: {
        ...process.env,
        ...options.env,
        FORCE_COLOR: '0',
        NO_COLOR: '1'
      },
      timeout: options.timeoutMs ?? getCommandTimeoutMs(),
      killSignal: 'SIGTERM',
      maxBuffer: 1024 * 1024 * 32
    })

    return {
      elapsedMs: performance.now() - startedAt,
      stdout: bufferToString(result.stdout),
      stderr: bufferToString(result.stderr)
    }
  } catch (error) {
    const commandError = error as {
      message?: string
      stdout?: string | Buffer
      stderr?: string | Buffer
    }
    const stdout = bufferToString(commandError.stdout)
    const stderr = bufferToString(commandError.stderr)
    throw new Error([
      `Command failed: ${command} ${args.join(' ')}`,
      commandError.message,
      stdout && `stdout:\n${stdout}`,
      stderr && `stderr:\n${stderr}`
    ].filter(Boolean).join('\n\n'))
  }
}

export async function runCommandStream(command: string, args: string[], cwd: string, options: CommandStreamOptions = {}): Promise<CommandRunResult> {
  const startedAt = performance.now()
  const timeoutMs = options.timeoutMs ?? getCommandTimeoutMs()
  const child = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      ...options.env,
      FORCE_COLOR: '0',
      NO_COLOR: '1'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  let stdout = ''
  let stderr = ''
  let timedOut = false
  let settled = false

  return new Promise((resolvePromise, rejectPromise) => {
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, timeoutMs)

    const settle = (callback: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      callback()
    }

    child.stdout?.on('data', (chunk: Buffer) => {
      const value = chunk.toString('utf8')
      stdout += value
      options.stdout?.(value)
    })

    child.stderr?.on('data', (chunk: Buffer) => {
      const value = chunk.toString('utf8')
      stderr += value
      options.stderr?.(value)
    })

    child.on('error', (error) => {
      settle(() => rejectPromise(new Error([
        `Command failed: ${command} ${args.join(' ')}`,
        error.message,
        stdout && `stdout:\n${stdout}`,
        stderr && `stderr:\n${stderr}`
      ].filter(Boolean).join('\n\n'))))
    })

    child.on('close', (code, signal) => {
      settle(() => {
        if (code === 0) {
          resolvePromise({
            elapsedMs: performance.now() - startedAt,
            stdout,
            stderr
          })
          return
        }

        rejectPromise(new Error([
          `Command failed: ${command} ${args.join(' ')}`,
          timedOut
            ? `Command timed out after ${timeoutMs}ms.`
            : `Command exited with ${signal ? `signal ${signal}` : `code ${code}`}.`,
          stdout && `stdout:\n${stdout}`,
          stderr && `stderr:\n${stderr}`
        ].filter(Boolean).join('\n\n')))
      })
    })
  })
}

export async function findCSSFiles(root: string) {
  const files = await findFiles(root)
  return files.filter((file) => extname(file) === '.css').sort()
}

export async function measureRelativeArtifact(file: string): Promise<BenchmarkArtifact> {
  const artifact = await measureArtifact(file)
  return {
    ...artifact,
    path: toRepoPath(file)
  }
}

export async function readFiles(files: string[]) {
  const buffers = await Promise.all(files.map((file) => readFile(file)))
  return Buffer.concat(buffers)
}

export function toRepoPath(path: string) {
  return relative(repoRoot, path).replace(/\\/g, '/')
}

async function findFiles(root: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }

  const nestedFiles = await Promise.all(entries.map(async (entry) => {
    const path = resolve(root, entry.name)
    if (entry.isDirectory()) return findFiles(path)
    if (entry.isFile()) return [path]
    return []
  }))

  return nestedFiles.flat()
}

function bufferToString(value: string | Buffer | undefined) {
  if (!value) return ''
  return Buffer.isBuffer(value) ? value.toString('utf8') : value
}

function getCommandTimeoutMs() {
  const value = Number(process.env.BENCHMARK_COMMAND_TIMEOUT_MS || 120000)
  if (!Number.isFinite(value) || value < 1000) return 120000
  return value
}
