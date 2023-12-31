import parseHTML from '../../../../../src/parse-html'
import fs from 'fs'
import path from 'path'
import MasterCSS from '@master/css'

const html = fs.readFileSync(path.join(__dirname, './document.html'), 'utf8')
const { classes } = parseHTML(html)

it('basic', () => {
    const css = new MasterCSS()
    classes.forEach((eachClass) => css.add(eachClass))
    const whereAndNonMediaRules = css.rules.filter(({ hasWhere, media, priority }) => hasWhere && !media && priority === -1)
    for (let i = 0; i < whereAndNonMediaRules.length; i++) {
        const currentRule = css.rules[i + 1]
        expect(currentRule.text).toBe(whereAndNonMediaRules[i].text)
    }
})