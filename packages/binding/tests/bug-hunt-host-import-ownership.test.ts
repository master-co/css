import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import { createCompilerBindingSession } from '../src/compiler-binding'

test('BH-0004 host import ownership has native/Wasm parity and preserves child external imports', async () => {
  const directory = process.env.BH_COMPILER_WASM_DIR ?? fileURLToPath(new URL('../../binding-wasm-compiler/artifacts/', import.meta.url))
  const native = await createCompilerBindingSession({ binding: 'native' })
  const wasm = await createCompilerBindingSession({ binding: 'wasm', wasm: {
    module: await import(pathToFileURL(join(directory, 'mastercss_binding_wasm_compiler.js')).href),
    input: readFileSync(join(directory, 'mastercss_binding_wasm_compiler_bg.wasm'))
  } })
  try {
    const request = {
      graph: { entry: '/entry.css', files: {
        '/entry.css': '/*😀*/@import "font-package" layer(fonts);@import "./child.css" layer(child);.entry{color:red}',
        '/child.css': '@import "https://remote.test/child.css";.child{color:blue}'
      }, edges: [{ from: '/entry.css', specifier: './child.css', resolved: '/child.css' }] },
      urls: { '/entry.css': '/output.css', '/child.css': '/output-child.css' },
      hostImports: { '/entry.css': ['font-package'] }, inlineImports: true
    }
    const a = native.compileCSSStylesheetGraph(request), b = wasm.compileCSSStylesheetGraph(request)
    expect(b).toEqual(a)
    expect(a.stylesheets).toHaveLength(2)
    const css = a.stylesheets.map(sheet => sheet.css).join('\n')
    expect(css).not.toMatch(/font-package|fonts/)
    expect(css).toContain('https://remote.test/child.css')
    expect(css).toContain('.entry')
    for (const compiler of [native, wasm]) for (const specifier of ['./child.css', 'missing']) {
      expect(() => compiler.compileCSSStylesheetGraph({ ...request, hostImports: { '/entry.css': [specifier] } })).toThrow('unresolved authored import')
    }
  } finally { native.dispose(); wasm.dispose() }
})
