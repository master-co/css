import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { expect, test } from 'vitest'
import { compileManifestFileSync } from '../src/node'

const baseManifest = { version: 6 as const, languageVersion: 18 as const }
const delivery = { entryURL: '/output/main.css', stylesheetURL: (file: string) => `/output/${basename(file)}`, resourceURL: (file: string) => `/output/${basename(file)}` }

function withDevice(entrySource: string, linkName: string, run: (entry: string, root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'master-css-filesystem-inputs-'))
  try {
    const entry = join(root, 'entry.css')
    writeFileSync(entry, entrySource)
    symlinkSync('/dev/zero', join(root, linkName))
    run(entry, root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test.skipIf(process.platform === 'win32')('an imported stylesheet that is not a regular file is rejected instead of read', () => {
  withDevice("@import './zero.css';.example{color:red}", 'zero.css', (entry, root) => {
    const options = { root, baseManifest, preserveNativeCSS: true, delivery }
    expect(() => compileManifestFileSync(entry, options)).toThrow('not a regular file')
  })
})

test.skipIf(process.platform === 'win32')('a stylesheet resource that is not a regular file is rejected before the host reads it', () => {
  withDevice('.example{background:url(./zero.png)}', 'zero.png', (entry, root) => {
    let read = false
    const options = { root, baseManifest, preserveNativeCSS: true, delivery: { ...delivery, resourceURL: (file: string) => { read = true; return `/output/${basename(file)}` } } }
    expect(() => compileManifestFileSync(entry, options)).toThrow('not a regular file')
    expect(read).toBe(false)
  })
})
