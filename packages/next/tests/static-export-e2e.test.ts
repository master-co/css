import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MASTER_CSS_HYDRATION_MANIFEST_ATTR } from '@master/css-schema/hydration-manifest'
import execPnpmSync from './helpers/pnpm-command'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'e2e/static-export')
const outDir = join(fixtureDir, 'out')

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

function collectHTMLFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filePath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectHTMLFiles(filePath))
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(filePath)
    }
  }
  return files
}

function collectHydrationManifestSources(html: string) {
  return [...html.matchAll(new RegExp(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="([^"]+)"`, 'g'))]
    .map((match) => match[1])
}

describe('static export e2e', () => {
  it('emits every referenced hydration manifest directly into the export output', () => {
    buildFixture()

    const htmlFiles = collectHTMLFiles(outDir)
    const manifestSources = htmlFiles.flatMap((htmlFile) =>
      collectHydrationManifestSources(readFileSync(htmlFile, 'utf-8'))
    )

    expect(htmlFiles.map((file) => relative(outDir, file).replaceAll('\\', '/'))).toEqual(expect.arrayContaining([
      'index.html',
      'nested.html'
    ]))
    expect(manifestSources.length).toBeGreaterThan(0)
    expect(existsSync(join(fixtureDir, '.next/static/master-css/hydration'))).toBe(false)

    for (const source of manifestSources) {
      const pathname = new URL(source, 'http://localhost').pathname
      const manifestFile = join(outDir, ...pathname.split('/').filter(Boolean))
      expect(pathname).toMatch(/^\/_next\/static\/master-css\/hydration\/master-css-hydration\.[0-9a-f]{8}\.json$/)
      expect(existsSync(manifestFile), `${source} should exist in the static export`).toBe(true)
      const manifest = JSON.parse(readFileSync(manifestFile, 'utf-8'))
      expect(manifest.version).toBe(1)
      expect(manifest.rules.length).toBeGreaterThan(0)
    }
  })
})
