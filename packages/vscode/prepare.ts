import path from 'node:path'
import syncFolder from '~/internal/utils/sync-folder'

const cwd = process.cwd()
const __dirname = path.dirname(new URL(import.meta.url).pathname)

syncFolder(path.join(__dirname, '../textmate-grammars'), path.join(cwd, './syntaxes'))