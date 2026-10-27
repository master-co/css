import type { DefinedMetadata, Metadata } from '~/site/docs-shell/types/Metadata'

const contentFolder = '/site/content'

/**
 * Derive the canonical pathname and repository source path from a page's `metadata.ts`
 * location under `site/content`. The machine-specific `fileURL` is dropped because
 * metadata reaches island props, category data and client bundles.
 */
export default function define({ fileURL, ...metadata }: Metadata) {
  const file = decodeURI(fileURL)
  const index = file.indexOf(contentFolder + '/')
  if (index === -1) {
    throw new Error('Invalid metadata fileURL: ' + file)
  }
  const directory = file.slice(index + contentFolder.length + 1).split('/').slice(0, -1)
  const pathname = '/' + directory
    .filter((basename: string) => !basename.startsWith('('))
    .join('/')
  return {
    ...metadata,
    sourcePath: ['site/content', ...directory, 'content.mdx'].join('/'),
    pathname
  } as DefinedMetadata
}
