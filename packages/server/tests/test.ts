import { readFileSync } from 'fs'
import { render } from '../src'
import { dirname, join } from 'path'

import fg from 'fast-glob'

fg.sync('**/*template.html', { cwd: __dirname })
    .forEach(templatePath => {
        const templateDirname = dirname(templatePath)
        test(templateDirname, () => {
            expect(
                render(
                    readFileSync(join(__dirname, templatePath)).toString()
                        .replace(/\*\*/g, '')
                        .replace(/^- .*/gm, ''),
                    require(join(__dirname, templateDirname, 'master.css.js')).default
                ).css?.text
            )
                .toEqual(readFileSync(join(__dirname, templateDirname, 'generated.css')).toString())
        })
    })
