import { renderRulesFromHTML } from '../../../src'
import fs from 'fs'
import path from 'path'

describe('master.co', () => {
    const html = fs.readFileSync(path.resolve(__dirname, './docs/animation.html'), 'utf8')
    const rules = renderRulesFromHTML(html)
    it('docs/animation', () => {
        const whereAndNonMediaRules = rules.filter(({ hasWhere, media, priority }) => hasWhere && !media && priority === -1)
        for (let i = 0; i < whereAndNonMediaRules.length; i++) {
            const currentRule = rules[i + 1]
            expect(currentRule.text).toBe(whereAndNonMediaRules[i].text)
        }
    })
})