import 'internal/scripts/prepare-app'

import path from 'path'
import { fileURLToPath } from 'url'
import copyOrSymlink from 'internal/utils/copy-or-symlink'

const cwd = process.cwd()

copyOrSymlink(fileURLToPath(new URL('./node_modules/monaco-editor/min/vs', import.meta.url)), path.resolve(cwd, './public/monaco-editor/vs'))
console.log('')
