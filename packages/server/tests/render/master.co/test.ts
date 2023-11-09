import parseHTML from '../../../src/parse-html'
import fs from 'fs'
import path from 'path'
import MasterCSS from '@master/css'

describe('master.co', () => {
    const html = fs.readFileSync(path.join(__dirname, './docs/animation.html'), 'utf8')
    const { classes } = parseHTML(html)
    const css = new MasterCSS()
    classes.forEach((eachClass) => css.add(eachClass))
    it('docs/animation', () => {
        const whereAndNonMediaRules = css.rules.filter(({ hasWhere, media, priority }) => hasWhere && !media && priority === -1)
        for (let i = 0; i < whereAndNonMediaRules.length; i++) {
            const currentRule = css.rules[i + 1]
            expect(currentRule.text).toBe(whereAndNonMediaRules[i].text)
        }
    })
})