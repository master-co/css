import { readFileSync } from 'fs'
import { renderHTML } from '../../src'

it('complex html', () => {
    expect(renderHTML(readFileSync(__dirname + '/complex.html').toString()))
        .toEqual('')
})