import 'internal/scripts/prepare-app'

import { rm } from 'node:fs/promises'
import { generateTranslatedContentRegistry } from './scripts/generate-translation-registry'

await generateTranslatedContentRegistry()

await rm(new URL('./public/monaco-editor', import.meta.url), { recursive: true, force: true })
