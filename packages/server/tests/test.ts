import { it, test, expect, describe } from 'vitest'
import { readFileSync } from 'fs'
import { render } from '../src'
import { dirname, join, resolve } from 'path'
import fg from 'fast-glob'

test.each(fg.sync('./fixtures/**/template.html', { cwd: __dirname }))('%s', async (templatePath) => {
    const templateDirname = dirname(templatePath)
    const generatedCSSFilename = join(__dirname, templateDirname, 'generated.css')
    const masterCSSFilename = join(__dirname, templateDirname, 'master.css.js')
    let config
    try {
        config = (await import(masterCSSFilename)).default
    } catch (e) { }
    expect(
        render(
            readFileSync(join(__dirname, templatePath)).toString(),
            config
        ).css?.text
    )
        .toBe(readFileSync(generatedCSSFilename).toString())
})