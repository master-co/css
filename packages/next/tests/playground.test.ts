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

function buildPlayground() {
  try {
    rmSync(join(playgroundDir, '.next'), { recursive: true, force: true })
    execPnpmSync(['--dir', playgroundDir, 'build'], {
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

function readJSONFiles(dir: string): string {
  return readOutputFiles(dir, (path) => path.endsWith('.json'))
}

function readManifestJSONSources(nextDir: string) {
  return [
    ...readOutputFileContents(join(nextDir, 'static/media'), (path) => path.endsWith('.json')),
    ...readOutputFileContents(join(nextDir, 'dev/static/media'), (path) => path.endsWith('.json'))
  ]
}

interface ManifestJSON {
  variables?: Record<string, { key: string }[]>
}

describe('playground', () => {
  it('imports the global CSS entry as a Next config module', () => {
    buildPlayground()

    const nextDir = join(playgroundDir, '.next')
    const htmlPath = join(nextDir, 'server/app/index.html')
    const html = readFileSync(htmlPath, 'utf-8')
    const clientSource = readJavaScriptFiles(join(nextDir, 'static/chunks'))
    const manifestJSONSources = readManifestJSONSources(nextDir)
    const manifestJSON = manifestJSONSources.map((source) => JSON.parse(source) as ManifestJSON)
    const manifestJSONSource = manifestJSONSources.join('\n')
    const hydrationManifestJSONSource = readJSONFiles(join(nextDir, 'static/master-css/hydration'))
    const hasVariable = (namespace: string, key: string) => manifestJSON.some((manifest) =>
      manifest.variables?.[namespace]?.some((variable) => variable.key === key)
    )

    expect(html).toContain('.fg\\:primary{color:var(--color-primary)}')
    expect(html).toContain(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="/_next/static/master-css/hydration/`)
    expect(html).not.toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
    expect(html.match(new RegExp(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`, 'g'))?.length ?? 0).toBe(0)
    expect(clientSource).toContain('__MASTER_CSS_NEXT_RUNTIME__')
    expect(clientSource).not.toContain(removedRuntimeRegistryName)
    expect(clientSource).not.toContain('var(--font-sans')
    expect(clientSource).not.toContain('#0070f3')
    expect(hasVariable('font-weight', 'bold')).toBe(true)
    expect(manifestJSONSource).toContain('#0070f3')
    expect(hydrationManifestJSONSource).toContain('"className":"fg:primary"')
  })
})
