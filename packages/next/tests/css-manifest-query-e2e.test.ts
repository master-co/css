import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import execPnpmSync from './helpers/pnpm-command'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'e2e/css-manifest-query')

function buildFixture() {
  try {
    execPnpmSync(['--dir', fixtureDir, 'build'], {
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

function collectOutputFiles(dir: string, matches: (filePath: string) => boolean): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filePath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectOutputFiles(filePath, matches))
    } else if (entry.isFile() && matches(filePath)) {
      files.push(filePath)
    }
  }
  return files
}

function isStaticMediaJSONFile(filePath: string) {
  const parts = filePath.split(sep)
  return filePath.endsWith('.json') && parts.includes('static') && parts.includes('media')
}

interface ManifestJSON {
  variables?: Record<string, { key: string }[]>
}

describe('css manifest query e2e', () => {
  it('builds a clean Next project that imports an explicit CSS manifest resource', () => {
    buildFixture()

    const nextDir = join(fixtureDir, '.next')
    const html = readFileSync(join(fixtureDir, '.next/server/app/index.html'), 'utf-8')
    const manifestJSONFiles = collectOutputFiles(nextDir, isStaticMediaJSONFile)
    const manifestJSONContents = manifestJSONFiles.map((filePath) => readFileSync(filePath, 'utf-8'))
    const manifestJSON = manifestJSONContents.map((contents) => JSON.parse(contents) as ManifestJSON)
    const jsBundleContents = collectOutputFiles(nextDir, (filePath) => filePath.endsWith('.js'))
      .map((filePath) => readFileSync(filePath, 'utf-8'))
      .join('\n')
    const hasVariable = (namespace: string, key: string) => manifestJSON.some((manifest) =>
      manifest.variables?.[namespace]?.some((variable) => variable.key === key)
    )

    expect(html).toContain('data-color="#4b6fff"')
    expect(html).toContain('data-breakpoint="1234"')
    expect(manifestJSONFiles.length).toBeGreaterThan(0)
    expect(hasVariable('font-weight', 'bold')).toBe(true)
    expect(hasVariable('color', 'e2e')).toBe(true)
    expect(jsBundleContents).not.toContain('font-weight-bold')
  })
})
