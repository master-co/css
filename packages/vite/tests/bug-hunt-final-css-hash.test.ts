import { createHash } from 'node:crypto'
import { expect, test, vi } from 'vitest'
import StyleEntryBuildPlugin from '../src/plugins/style-entry-build'

async function prepare(css: string, pattern: string | ((asset: any) => string), hashCharacters?: 'hex' | 'base64' | 'base36') {
  const context = {
    scanner: { slotCSSRule: '#master-css-slot{--slot:0}', css: { manifest: {} } },
    stylesheets: { compose: vi.fn(async () => ({ css, emittedGlobals: {} })) }
  } as any
  const plugin = StyleEntryBuildPlugin({}, context)
  const output = (plugin.outputOptions as any)({ assetFileNames: pattern, hashCharacters })
  await (plugin.renderStart as any)()
  return { plugin, context, output }
}

const asset = { type: 'asset', name: 'index.css', names: ['index.css'], originalFileNames: [], source: 'body{margin:0}#master-css-slot{--slot:0}' }

test('BH-0045 hashes the exact final CSS bytes before naming the asset', async () => {
  for (const hashCharacters of ['hex', 'base64', 'base36'] as const) {
    const css = '.example{color:red}'
    const { plugin, output } = await prepare(css, 'custom/[name]-[hash:12][extname]', hashCharacters)
    const bytes = createHash('sha256').update('body{margin:0}' + css).digest()
    const hash = hashCharacters === 'hex' ? bytes.toString('hex') : hashCharacters === 'base36' ? BigInt(`0x${bytes.toString('hex')}`).toString(36) : bytes.toString('base64url')
    expect(output.assetFileNames(asset)).toBe(`custom/[name]-${hash.slice(0, 12)}[extname]`)
    const bundle = { 'custom/index.css': { type: 'asset', source: asset.source } }
    await (plugin.generateBundle as any).call({ warn: vi.fn() }, {}, bundle)
    expect(bundle['custom/index.css'].source).toBe('body{margin:0}' + css)
  }
})

test('BH-0045 gives custom filename callbacks the final CSS and preserves fixed filenames', async () => {
  const callback = vi.fn((entry: any) => entry.source.includes('color:red') ? 'red/[name]-[hash:8].css' : 'wrong.css')
  const { output } = await prepare('.example{color:red}', callback)
  expect(output.assetFileNames(asset)).toMatch(/^red\/\[name\]-[\w-]{8}\.css$/)
  expect(callback).toHaveBeenCalledWith(expect.objectContaining({ source: 'body{margin:0}.example{color:red}' }))
  const fixed = await prepare('.example{color:red}', 'fixed.css')
  expect(fixed.output.assetFileNames(asset)).toBe('fixed.css')
})

test('BH-0045 leaves non-managed CSS and non-CSS asset patterns unchanged', async () => {
  const { output } = await prepare('.example{color:red}', 'assets/[name]-[hash][extname]')
  for (const entry of [{ ...asset, source: '.plain{color:blue}' }, { ...asset, name: 'data.json', names: ['data.json'] }]) {
    expect(output.assetFileNames(entry)).toBe('assets/[name]-[hash][extname]')
  }
})

test('BH-0045 uses one finished extraction for naming and publication', async () => {
  const { plugin, output, context } = await prepare('.example{color:red}', '[name]-[hash].css')
  const name = output.assetFileNames(asset)
  context.stylesheets.compose.mockResolvedValue({ css: '.example{color:blue}', emittedGlobals: {} })
  const bundle = { 'index.css': { type: 'asset', source: asset.source } }
  await (plugin.generateBundle as any).call({ warn: vi.fn() }, {}, bundle)
  expect(output.assetFileNames(asset)).toBe(name)
  expect(bundle['index.css'].source).toContain('color:red')
  expect(context.stylesheets.compose).toHaveBeenCalledTimes(1)
})
