import { mkdir, writeFile } from 'node:fs/promises'
import { createLanguageSessionSync } from '@master/css-tooling/language/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }

/** Materialize Rust-owned facts before loading modules shared with client UI. */
export async function prepareTokenFamilies() {
  using session = createLanguageSessionSync({ manifest: preset as MasterCSSManifest })
  const directory = new URL('../.generated/', import.meta.url)
  await mkdir(directory, { recursive: true })
  await writeFile(new URL('preset-token-families.json', directory), JSON.stringify(session.tokenFamilies()))
}
