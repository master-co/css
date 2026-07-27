import { execFileSync } from 'child_process'
import { createRequire } from 'module'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { describe, expect, it } from 'vitest'
import pkg from '../package.json' with { type: 'json' }

const cliFilepath = resolve(__dirname, '../src/bin/index.ts')
const tsconfigPath = resolve(__dirname, '../../../tsconfig.json')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href

function runCLI(args: string[]) {
  return execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      TSX_TSCONFIG_PATH: tsconfigPath
    }
  })
}

function runFailedCLI(args: string[]) {
  try {
    runCLI(args)
  } catch (error) {
    return error as { stderr?: Buffer | string, status?: number }
  }
  throw new Error(`Expected CLI command to fail: ${args.join(' ')}`)
}

describe('rc.87 root command divergences', () => {
  it('uses the explicit generate command instead of rc.87 root scan options', () => {
    const output = runCLI(['--help'])
    expect(output).toContain('Usage: master-css [options] [command]')
    expect(output).toContain('generate')
    expect(output).toContain('lint')
    expect(output).toContain('inspect')
    expect(output.split('\n')[0]).not.toContain('[source paths...]')
  })

  it.each(['extract', 'render', 'scan'])('does not restore the removed rc.87 %s command shim', (command) => {
    const error = runFailedCLI([command])
    expect(error.status).toBe(1)
    expect(String(error.stderr)).toContain(`unknown command '${command}'`)
    expect(String(error.stderr)).not.toContain('was removed')
  })

  it('publishes only the master-css binary', () => {
    expect(pkg.bin).toEqual({
      'master-css': './dist/bin/index.js'
    })
  })
})
