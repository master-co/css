import 'internal/scripts/prepare-app'

import { rm } from 'node:fs/promises'

await rm(new URL('./public/monaco-editor', import.meta.url), { recursive: true, force: true })
