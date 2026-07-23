import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { describe, it } from 'vitest'

const require = createRequire(import.meta.url)
const tscPath = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin', 'tsc')

describe('@master/css/client', () => {
  it('provides types for Master CSS integration virtual modules', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-client-'))

    try {
      const cssPackageDir = path.join(root, 'node_modules', '@master', 'css')
      const schemaPackageDir = path.join(root, 'node_modules', '@master', 'css-schema')
      const sourceDir = path.join(root, 'src')

      mkdirSync(cssPackageDir, { recursive: true })
      mkdirSync(schemaPackageDir, { recursive: true })
      mkdirSync(sourceDir, { recursive: true })

      writeFileSync(
        path.join(cssPackageDir, 'package.json'),
        JSON.stringify({
          name: '@master/css',
          exports: {
            './client': {
              types: './client.d.ts'
            }
          }
        })
      )
      writeFileSync(
        path.join(cssPackageDir, 'client.d.ts'),
        readFileSync(path.resolve(__dirname, '../client.d.ts'), 'utf8')
      )
      writeFileSync(
        path.join(schemaPackageDir, 'package.json'),
        JSON.stringify({
          name: '@master/css-schema',
          exports: {
            './manifest': {
              types: './manifest.d.ts'
            },
            './emitted-globals': {
              types: './emitted-globals.d.ts'
            }
          }
        })
      )
      writeFileSync(
        path.join(schemaPackageDir, 'manifest.d.ts'),
        'export interface MasterCSSManifest { version: 1 }\n'
      )
      writeFileSync(
        path.join(schemaPackageDir, 'emitted-globals.d.ts'),
        'export interface MasterCSSEmittedGlobals { variables?: Record<string, number>; animations?: Record<string, number> }\n'
      )
      writeFileSync(
        path.join(sourceDir, 'main.ts'),
        `
/// <reference types="@master/css/client" />

import 'virtual:master-utilities.css'
import virtualManifest from 'virtual:master-css-manifest'
import virtualEmittedGlobals from 'virtual:master-css-emitted-globals'
import localManifest from './app.css?master-css-manifest'

virtualManifest satisfies import('@master/css-schema/manifest').MasterCSSManifest
virtualEmittedGlobals satisfies import('@master/css-schema/emitted-globals').MasterCSSEmittedGlobals
localManifest satisfies import('@master/css-schema/manifest').MasterCSSManifest
`.trimStart()
      )
      writeFileSync(
        path.join(root, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            module: 'ESNext',
            moduleResolution: 'bundler',
            strict: true,
            noEmit: true
          },
          include: ['src']
        })
      )

      execFileSync(process.execPath, [tscPath, '-p', root, '--pretty', 'false'], {
        cwd: root,
        stdio: 'pipe'
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
