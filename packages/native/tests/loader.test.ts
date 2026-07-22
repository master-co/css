import { describe, expect, it } from 'vitest'
import { nativeAddonsDisabled, resolveNativeTarget } from '../src'

describe('native target resolution', () => {
  it('resolves the eight Tier-1 packages', () => {
    expect(resolveNativeTarget('darwin', 'arm64')?.packageName).toBe('@master/css-native-darwin-arm64')
    expect(resolveNativeTarget('darwin', 'x64')?.packageName).toBe('@master/css-native-darwin-x64')
    expect(resolveNativeTarget('win32', 'arm64')?.packageName).toBe('@master/css-native-win32-arm64-msvc')
    expect(resolveNativeTarget('win32', 'x64')?.packageName).toBe('@master/css-native-win32-x64-msvc')
    expect(resolveNativeTarget('linux', 'arm64', 'glibc')?.packageName).toBe('@master/css-native-linux-arm64-gnu')
    expect(resolveNativeTarget('linux', 'arm64', 'musl')?.packageName).toBe('@master/css-native-linux-arm64-musl')
    expect(resolveNativeTarget('linux', 'x64', 'glibc')?.packageName).toBe('@master/css-native-linux-x64-gnu')
    expect(resolveNativeTarget('linux', 'x64', 'musl')?.packageName).toBe('@master/css-native-linux-x64-musl')
  })

  it('leaves unsupported targets to the Wasm fallback', () => {
    expect(resolveNativeTarget('linux', 'arm', 'glibc')).toBeUndefined()
    expect(resolveNativeTarget('freebsd', 'x64')).toBeUndefined()
  })

  it('recognizes the Node addon kill switch', () => {
    expect(nativeAddonsDisabled(['--no-addons'])).toBe(true)
    expect(nativeAddonsDisabled([])).toBe(false)
  })
})
