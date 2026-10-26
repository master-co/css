import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { createEngineSync } from '@master/css/node'
import { toVirtualCSSManifestModulePath } from '@master/css-internal/node'
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

describe('css manifest query e2e', () => {
  const nextDir = join(fixtureDir, '.next-query')
  const readHTML = () => readFileSync(join(nextDir, 'server/app/index.html'), 'utf-8')

  beforeAll(buildFixture, 180000)

  it('builds a clean Next project that imports an explicit CSS manifest resource', () => {
    const html = readHTML()
    const manifestJSONFiles = collectOutputFiles(nextDir, isStaticMediaJSONFile)
    const jsBundleContents = collectOutputFiles(nextDir, (filePath) => filePath.endsWith('.js'))
      .map((filePath) => readFileSync(filePath, 'utf-8'))
      .join('\n')
    expect(html).toContain('data-color="#4b6fff"')
    expect(html).toContain('data-breakpoint="1234"')
    expect(html).toContain('data-font-weight="700"')
    expect(manifestJSONFiles).toEqual([])
    expect(html).toContain('/assets/_next/')
    expect(jsBundleContents).toContain('#4b6fff')
    expect(jsBundleContents).not.toContain('loadMasterCSSManifestFromImport')
  })

  it('delivers the production runtime program of an explicit CSS program resource', async () => {
    // The import loader rewrites the query to the entry's generated production program.
    const html = readHTML()
    const programHash = html.match(/data-program-sha256="([0-9a-f]{64})"/)?.[1]
    expect(html).toContain('data-program-magic="MCSP"')
    const programModulePath = toVirtualCSSManifestModulePath(fixtureDir, join(fixtureDir, 'app/theme.css'))
      .replace(/\.manifest\.js$/, '.production.program.js')
    const { default: program } = await import(pathToFileURL(programModulePath).href) as { default: Uint8Array }
    expect(createHash('sha256').update(program).digest('hex')).toBe(programHash)
    expect(Buffer.from(program).includes(fixtureDir)).toBe(false)
    using engine = createEngineSync({ program })
    expect(JSON.stringify(engine.ensureClassRules(['fg-e2e']).mutations)).toContain('--color-e2e:#4b6fff')
  })
})
