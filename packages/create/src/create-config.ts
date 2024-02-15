import log from '@techor/log'
import { existsSync, writeFileSync } from 'node:fs'
import CONFIG_ESM_TEXT from './master.css.mjs.js'
import CONFIG_TS_TEXT from './master.css.ts.js'
import CONFIG_TEXT from './master.css.js.js'
import { Options } from './Options.js'

export default (options: Options) => {
    const create = (fileName: string, text: string) => {
        const configExists = existsSync(fileName)
        if (!configExists) {
            writeFileSync(fileName, text)
            log.ok`Created **${fileName}**`
        } else if (configExists && options.override) {
            writeFileSync(fileName, text)
            log.ok`**${fileName}** is overridden`
        } else {
            log.x`**${fileName}** already exists`
        }
    }
    // create master.css.* file
    switch (options.ext) {
        case 'js':
            create('master.css.js', CONFIG_TEXT)
            break
        case 'mjs':
            create('master.css.mjs', CONFIG_ESM_TEXT)
            break
        case 'ts':
            create('master.css.ts', CONFIG_TS_TEXT)
            break
    }
}