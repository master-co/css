import 'shared/test/matchMedia.mock'
import { getPreInitScript } from '../src'

it('checks that init scripts handle custom themes correctly', () => {
    localStorage.setItem('theme', 'christmas')
    eval(getPreInitScript())
    expect(document.documentElement.classList.contains('christmas')).toBeTruthy()
    expect(document.documentElement.getAttribute('style')).toBeFalsy()
})