import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { toHashedManifestAssetFileName } from '@master/css-internal/node'
import { externalizeHydrationManifest } from '@master/css-server'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE,
  MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME
} from '@master/css-schema/hydration-manifest'

function toHydrationManifestAssetURL(fileName: string, base = MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE) {
  return `${base.replace(/\/?$/, '/')}${fileName}`
}

function toPublicAssetBase(base = '/') {
  return `${base.replace(/\/?$/, '/')}_master-css/hydration/`
}

async function collectHTMLFiles(dir: string, files: string[] = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const filePath = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== '_master-css') await collectHTMLFiles(filePath, files)
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(filePath)
    }
  }
  return files
}

export async function externalizeAstroHydrationManifests(dir: URL | string, base?: string) {
  const root = typeof dir === 'string' ? dir : fileURLToPath(dir)
  const htmlFiles = await collectHTMLFiles(root)
  const writtenFiles: string[] = []
  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, 'utf8')
    let fileName = ''
    const externalized = externalizeHydrationManifest(html, (json) => {
      fileName = toHashedManifestAssetFileName(json, MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME)
      return toHydrationManifestAssetURL(fileName, toPublicAssetBase(base))
    })
    if (!externalized) continue
    const outputDir = join(root, '_master-css', 'hydration')
    const outputFile = join(outputDir, fileName)
    await mkdir(outputDir, { recursive: true })
    await writeFile(outputFile, externalized.json)
    await writeFile(htmlFile, externalized.html)
    writtenFiles.push(outputFile)
  }
  return writtenFiles
}
