import { describe, expect, test } from 'vitest'
import CSSScanner from '../src'

describe('CSSScanner public API', () => {
  test('does not expose file lifecycle or export helpers', async () => {
    const scanner = await new CSSScanner({}).init()

    expect('prepare' in scanner).toBe(false)
    expect('scanFile' in scanner).toBe(false)
    expect('scanFiles' in scanner).toBe(false)
    expect('fixedSourcePaths' in scanner).toBe(false)
    expect('allowedSourcePaths' in scanner).toBe(false)
    expect('startWatch' in scanner).toBe(false)
    expect('closeWatch' in scanner).toBe(false)
    expect('watchSources' in scanner).toBe(false)
    expect('watch' in scanner).toBe(false)
    expect('export' in scanner).toBe(false)
  })

  test('can reset scanner state without source discovery', async () => {
    const scanner = await new CSSScanner({}).init()

    await scanner.scan('index.html', '<div class="block"></div>')
    expect(scanner.validClasses.has('block')).toBe(true)

    await scanner.reset()

    expect(scanner.validClasses.has('block')).toBe(false)
  })

  test('inserts safelist during init and reset', async () => {
    const scanner = await new CSSScanner({
      safelist: ['block']
    }).init()

    expect(scanner.css.text).toContain('.block{display:block}')

    await scanner.scan('index.html', '<div class="fg:red"></div>')
    await scanner.reset()

    expect(scanner.validClasses.has('fg:red')).toBe(false)
    expect(scanner.css.text).toContain('.block{display:block}')
  })
})
