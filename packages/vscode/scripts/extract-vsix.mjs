import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { win32 } from 'node:path'

export function extractVSIX(archive, destination, { platform = process.platform, env = process.env, execute = execFileSync } = {}) {
  if (platform === 'win32') {
    // Git Bash's GNU tar interprets a drive letter as a remote archive host and
    // cannot read ZIP. Windows's bundled bsdtar supports both paths and VSIX ZIPs.
    const systemRoot = env.SystemRoot ?? env.SYSTEMROOT
    assert.ok(systemRoot && win32.isAbsolute(systemRoot), 'Windows SystemRoot is required to select the native ZIP extractor')
    return execute(win32.join(systemRoot, 'System32', 'tar.exe'), ['-xf', archive, '-C', destination], { env })
  }
  return execute('unzip', ['-q', archive, '-d', destination], { env })
}
