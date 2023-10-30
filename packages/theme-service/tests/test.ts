import 'css-shared/test/matchMedia.mock'
import { init } from '../src'

const themeService = init({ default: 'dark' })

it('contains dark class and the dark color scheme', () => {
    expect(document.documentElement.classList.contains('dark')).toBeTruthy()
    expect(document.documentElement.getAttribute('style')).toEqual('color-scheme: dark;')
})

it(`localStorage should be null after init`, () => {
    expect(localStorage.getItem('theme')).toBeNull()
})

it('switches to the light theme', () => {
    themeService.switch('light')
    expect(document.documentElement.classList.contains('light')).toBeTruthy()
    expect(document.documentElement.getAttribute('style')).toEqual('color-scheme: light;')
    expect(themeService.current).toBe('light')
    expect(themeService.value).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
})

it('should not contain the dark class after switching', () => {
    expect(document.documentElement.classList.contains('dark')).toBeFalsy()
})

it('switches to the user\'s system preference', () => {
    themeService.switch('system')
    // In the jest-dom mock environment, it's always the light theme.
    expect(document.documentElement.classList.contains('light')).toBeTruthy()
    expect(document.documentElement.getAttribute('style')).toEqual('color-scheme: light;')
    expect(themeService.current).toBe('light')
    expect(themeService.value).toBe('system')
    expect(localStorage.getItem('theme')).toBe('system')
})

it('switches to a custom theme', () => {
    themeService.switch('christmas')
    expect(document.documentElement.classList.contains('christmas')).toBeTruthy()
    expect(themeService.current).toBe('christmas')
    expect(themeService.value).toBe('christmas')
    expect(localStorage.getItem('theme')).toBe('christmas')
})

it('should not contain the color scheme style after switching', () => {
    expect(document.documentElement.getAttribute('style')).toBeFalsy()
})

it('destroys and restores', () => {
    themeService.switch('dark')
    themeService.destroy()
    expect(document.documentElement.className).toBeFalsy()
    expect(document.documentElement.getAttribute('style')).toBeFalsy()
    expect(localStorage.getItem('theme')).toBeNull()
})