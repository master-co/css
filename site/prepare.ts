import 'internal/scripts/prepare-app'

import path from 'path'
import { createRequire } from 'node:module'
import copyOrSymlink from 'internal/utils/copy-or-symlink'

const cwd = process.cwd()
const require = createRequire(import.meta.url)
const monacoVsPath = path.join(path.dirname(require.resolve('monaco-editor/package.json')), 'min/vs')

copyOrSymlink(monacoVsPath, path.resolve(cwd, './public/monaco-editor/vs'))
console.log('')
