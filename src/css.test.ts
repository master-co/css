import MasterCSS from '.'
import delay from './utils/delay'
import $ from 'jquery'

test('css', async () => {
    const $p1 = $('p', { class: 'block font:bold' })
    $(document.body).append($p1)
    const css = new MasterCSS()
    $p1.addClass('italic')
    $p1.remove()
    await delay()
    expect(css.countOfClass).toEqual({})
})