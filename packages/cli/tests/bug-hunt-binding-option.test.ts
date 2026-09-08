import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

test('BH-0026 rejects unknown binding names instead of silently using auto', () => {
  let failure: { status?: number, stderr?: string | Buffer } | undefined
  try {
    execFileSync(process.execPath, ['--import', createRequire(import.meta.url).resolve('tsx'),
      fileURLToPath(new URL('../src/bin/index.ts', import.meta.url)), 'generate', '--binding', 'other', '--no-export'], { encoding: 'utf8', stdio: 'pipe' })
  } catch (error) { failure = error as typeof failure }
  expect(failure?.status).toBe(1)
  expect(String(failure?.stderr)).toContain('Allowed choices are auto, native, wasm')
})
