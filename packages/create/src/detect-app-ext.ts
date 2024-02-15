import { readJSONFileSync } from '@techor/fs'
import { existsSync } from 'fs'
import log from '@techor/log'

export default (): 'mjs' | 'ts' | 'js' => {
    // automatically detect the format
    if (existsSync('tsconfig.json')) {
        log.i`Detected **tsconfig.json**`
        return 'ts'
    } else {
        const { type } = readJSONFileSync('./package.json') || {}
        if (type === 'module') {
            log.i`package.json has **type="module"** set`
            return 'mjs'
        } else {
            return 'js'
        }
    }
}