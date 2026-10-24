import type { DefinedMetadata, Metadata } from '~/site/docs-shell/types/Metadata'

const contentFolder = '/site/content'

/** Derive the canonical pathname from a page's `metadata.ts` location under `site/content`. */
export default function define(metadata: Metadata) {
  metadata.fileURL = decodeURI(metadata.fileURL)
  const index = metadata.fileURL.indexOf(contentFolder + '/')
  if (index === -1) {
    throw new Error('Invalid metadata fileURL: ' + metadata.fileURL)
  }
  const pathname = '/' + metadata.fileURL
    .slice(index + contentFolder.length + 1)
    .split('/')
    .filter((basename: string) => basename !== 'metadata.ts' && !basename.startsWith('('))
    .join('/')
  return {
    ...metadata,
    pathname: pathname === '/' ? pathname : pathname.replace(/\/$/, '')
  } as DefinedMetadata
}
