import type { DefinedMetadata, Metadata } from '~/site/docs-shell/types/Metadata'
import { fileURLToPath } from 'url'

export default function define(metadata: Metadata) {
  const localeFolder = '[locale]'
  // fix '%5Blocale%5D' to '[locale]' in vercel build
  metadata.fileURL = decodeURI(metadata.fileURL)
  const pathname = metadata.fileURL
    .slice(metadata.fileURL.indexOf(localeFolder) + localeFolder.length)
    .split('/')
    .filter((basename: string) => basename !== 'metadata.ts' && !basename.startsWith('('))
    .join('/')
  if (!pathname) {
    throw new Error('Invalid metadata fileURL: ' + metadata.fileURL)
  }
  return {
    ...metadata,
    pathname
  } as DefinedMetadata
}