import { readFileSync } from 'fs'
import parseHTML from '../../src/parse-html'

it('complex html', () => {
    const { classes } = parseHTML(readFileSync(__dirname + '/complex.html').toString())
    expect(classes).toContain('app-header-nav')
})