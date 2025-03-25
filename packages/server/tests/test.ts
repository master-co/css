import { it, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { render } from '../src'
import { dirname, join, resolve } from 'path'
import fg from 'fast-glob'

fg.sync('../../../site/app/**/tests/**/template.html', { cwd: __dirname })
    .forEach(templatePath => {
        const templateDirname = dirname(templatePath)
        const generatedCSSFilename = join(__dirname, templateDirname, 'generated.css')
        const masterCSSFilename = join(__dirname, templateDirname, 'master.css.js')
        test(generatedCSSFilename, async () => {
            const config = (await import(masterCSSFilename)).default
            expect(
                render(
                    readFileSync(join(__dirname, templatePath)).toString(),
                    config
                ).css?.text
            )
                .toEqual(readFileSync(generatedCSSFilename).toString())
        })
    })