import { MasterCSS, extractClassesFromHTML } from '../../../src'
import fs from 'fs'
import path from 'upath'

describe('master.co', () => {
    const html = fs.readFileSync(path.join(__dirname, './docs/animation.html'), 'utf8')
    const classes = extractClassesFromHTML(html)
    const css = new MasterCSS()
    classes.forEach((eachClass) => css.insert(eachClass))
    it('docs/animation', () => {
        const whereAndNonMediaRules = css.rules.filter(({ hasWhere, media, priority }) => hasWhere && !media && priority === -1)
        for (let i = 0; i < whereAndNonMediaRules.length; i++) {
            const currentRule = css.rules[i + 1]
            expect(currentRule.text).toBe(whereAndNonMediaRules[i].text)
        }
    })
})