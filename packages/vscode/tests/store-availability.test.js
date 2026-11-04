import { expect, test } from 'vitest'
import { verifyStoreAvailability } from '../scripts/verify-store-availability.mjs'

const manifest = { name: '@master/css-vscode', publisher: 'masterco', version: '2.0.37' }
const metadata = () => ({ publisher: { publisherName: 'masterco' }, extensionName: 'master-css-vscode', versions: [{ version: '2.0.36' }] })
const absent = async () => ({ status: 404, json: async () => ({ error: 'Extension version not found' }) })
const options = { marketplace: async () => metadata(), fetchMetadata: absent }

test('checks the source identity and candidate version using public reads on all targets', async () => {
  const requests = []
  const result = await verifyStoreAvailability(manifest, {
    marketplace: async id => { expect(id).toBe('masterco.master-css-vscode'); return metadata() },
    fetchMetadata: async (url, init) => {
      expect(new URL(url).origin).toBe('https://open-vsx.org')
      expect(url).toMatch(/\/master\/master-css-vscode\/[^/]+\/2\.0\.37$/)
      expect(init.method).toBeUndefined()
      expect(init.redirect).toBe('error')
      expect(init.signal).toBeInstanceOf(AbortSignal)
      expect(init.headers.authorization).toBeUndefined()
      requests.push(url)
      return absent()
    }
  })
  expect(requests).toHaveLength(9)
  expect(new Set(requests).size).toBe(9)
  expect(result).toMatchObject({ available: true, version: manifest.version, publicationPerformed: false })
})

test('any previously published Marketplace target blocks the source candidate, including partial publication', async () => {
  await expect(verifyStoreAvailability(manifest, { ...options, marketplace: async () => ({ ...metadata(),
    versions: [{ version: manifest.version, targetPlatform: 'win32-arm64' }] }) })).rejects.toThrow('already exists: masterco.master-css-vscode/win32-arm64')
})

test('any previously published Open VSX target blocks the source candidate', async () => {
  await expect(verifyStoreAvailability(manifest, { ...options, fetchMetadata: async url => {
    if (!url.includes('/alpine-arm64/')) return absent()
    return { status: 200, json: async () => ({ namespace: 'master', name: 'master-css-vscode', version: manifest.version, targetPlatform: 'alpine-arm64' }) }
  } })).rejects.toThrow('already exists: master.master-css-vscode/alpine-arm64')
})

test('unknown HTTP, malformed JSON, timeout, and missing metadata fail closed', async () => {
  for (const status of [301, 401, 403, 429, 500]) {
    await expect(verifyStoreAvailability(manifest, { ...options, fetchMetadata: async () => ({ status }) })).rejects.toThrow(`HTTP ${status}`)
  }
  for (const fetchMetadata of [
    async () => ({ status: 404, json: async () => ({}) }),
    async () => ({ status: 404, json: async () => { throw new SyntaxError('Invalid JSON') } }),
    async () => { throw new Error('Lookup timed out') }
  ]) await expect(verifyStoreAvailability(manifest, { ...options, fetchMetadata })).rejects.toThrow()
  await expect(verifyStoreAvailability(manifest, { ...options, marketplace: async () => undefined })).rejects.toThrow('identity differs')
  await expect(verifyStoreAvailability(manifest, { ...options, marketplace: async () => ({ ...metadata(), versions: [] }) })).rejects.toThrow('inventory is missing')
})

test('mismatching source, Marketplace and Open VSX identities fail closed', async () => {
  for (const altered of [{ ...manifest, name: '@master/other' }, { ...manifest, publisher: 'other' }, { ...manifest, version: '../2.0.37' }]) {
    await expect(verifyStoreAvailability(altered, options)).rejects.toThrow()
  }
  await expect(verifyStoreAvailability(manifest, { ...options, marketplace: async () => ({ ...metadata(), extensionName: 'other' }) })).rejects.toThrow('identity differs')
  for (const wrong of [{ namespace: 'other' }, { name: 'other' }, { version: '2.0.36' }, { targetPlatform: 'wrong' }]) {
    await expect(verifyStoreAvailability(manifest, { ...options, fetchMetadata: async url => ({ status: 200,
      json: async () => ({ namespace: 'master', name: 'master-css-vscode', version: manifest.version, targetPlatform: url.split('/').at(-2), ...wrong }) }) })).rejects.toThrow('identity differs')
  }
})
