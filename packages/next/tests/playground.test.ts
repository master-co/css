import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from '@master/css-schema/hydration-manifest'
import execPnpmSync from './helpers/pnpm-command'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const playgroundDir = join(packageDir, 'playground')
const removedRuntimeRegistryName = ['CSSRuntime', 'Registry'].join('')

function buildPlayground(bundler: 'turbopack' | 'webpack') {
  try {
    rmSync(join(playgroundDir, '.next'), { recursive: true, force: true })
    execPnpmSync(['--dir', playgroundDir, 'exec', 'next', 'build', `--${bundler}`], {
      cwd: packageDir,
      encoding: 'utf-8',
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: '1'
      },
      stdio: 'pipe',
      timeout: 120000
    })
  } catch (error) {
    const buildError = error as Error & { stdout?: string | Buffer, stderr?: string | Buffer }
    throw new Error([
      buildError.message,
      buildError.stdout?.toString(),
      buildError.stderr?.toString()
    ].filter(Boolean).join('\n'))
  }
}

function readOutputFileContents(dir: string, matches: (path: string) => boolean): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return readOutputFileContents(path, matches)
    return matches(path) ? [readFileSync(path, 'utf-8')] : []
  })
}

function readOutputFiles(dir: string, matches: (path: string) => boolean): string {
  return readOutputFileContents(dir, matches).join('\n')
}

function readJavaScriptFiles(dir: string): string {
  return readOutputFiles(dir, (path) => path.endsWith('.js'))
}

describe('playground', () => {
  it.each(['turbopack', 'webpack'] as const)('defaults to static CSS without browser runtime assets in %s', (bundler) => {
    buildPlayground(bundler)
    const nextDir = join(playgroundDir, '.next')
    const html = readFileSync(join(nextDir, 'server/app/index.html'), 'utf-8')
    const clientSource = readJavaScriptFiles(join(nextDir, 'static/chunks'))
    const css = readOutputFiles(join(nextDir, 'static'), path => path.endsWith('.css'))
    expect(html).toContain('rel="stylesheet"')
    expect(css).toContain('.fg-primary{color:var(--color-primary)}')
    expect(css).toContain('#0070f3')
    expect(html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_ATTR)
    expect(html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
    expect(clientSource).not.toContain('__MASTER_CSS_NEXT_RUNTIME__')
    expect(clientSource).not.toContain(removedRuntimeRegistryName)
    expect(clientSource).not.toContain('mastercss_binding_wasm')
    expect(clientSource).not.toContain('"nativeTokenNamespaces"')
    expect(readOutputFileContents(join(nextDir, 'static'), path => path.endsWith('.wasm'))).toEqual([])
    expect(existsSync(join(nextDir, 'static/master-css/hydration'))).toBe(false)
  })
})
