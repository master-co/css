import { extractClassesFromHTML } from '../src'

it('extract classes from HTML', () => {
    expect(
        extractClassesFromHTML(`
            <div class="font:12 text:center">
                <div class="block"></div>
            </div>
        `)
    ).toEqual(['font:12', 'text:center', 'block'])
})