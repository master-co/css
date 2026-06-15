import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
    createPlayShare,
    getPlayHealth,
    getPlayShare,
    handlePlayOptions,
    type PlayEnv
} from './route-handlers'

class MemoryKV {
    values = new Map<string, string>()
    puts: Array<{ key: string, value: string, options?: { expirationTtl?: number } }> = []

    async get(key: string) {
        return this.values.get(key) || null
    }

    async put(key: string, value: string, options?: { expirationTtl?: number }) {
        this.puts.push({ key, value, options })
        this.values.set(key, value)
    }
}

test('returns Play API health response', async () => {
    const env = createEnv()
    const response = getPlayHealth(createRequest('/api/play/health'), env)

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await response.json(), { ok: true })
})

test('returns CORS headers for OPTIONS requests', () => {
    const env = createEnv({ PLAY_ALLOWED_ORIGINS: 'https://css.master.co' })
    const response = handlePlayOptions(createRequest('/api/play/shares', {
        method: 'OPTIONS',
        headers: {
            origin: 'https://css.master.co'
        }
    }), env)

    assert.equal(response.status, 204)
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://css.master.co')
    assert.equal(response.headers.get('access-control-allow-methods'), 'GET,POST,OPTIONS')
})

test('normalizes allowed CORS origins', () => {
    const env = createEnv({ PLAY_ALLOWED_ORIGINS: 'http://localhost:3000/' })
    const response = handlePlayOptions(createRequest('/api/play/shares', {
        method: 'OPTIONS',
        headers: {
            origin: 'http://localhost:3000/'
        }
    }), env)

    assert.equal(response.status, 204)
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000')
})

test('uses configured CORS origins instead of merging defaults', () => {
    const env = createEnv({ PLAY_ALLOWED_ORIGINS: 'https://css.master.co' })
    const response = handlePlayOptions(createRequest('/api/play/shares', {
        method: 'OPTIONS',
        headers: {
            origin: 'http://localhost:3000'
        }
    }), env)

    assert.equal(response.status, 204)
    assert.equal(response.headers.get('access-control-allow-origin'), 'null')
})

test('creates and reads a Play share from KV', async () => {
    const env = createEnv()
    const createResponse = await createPlayShare(createJsonRequest('/api/play/shares', {
        files: [
            {
                title: 'HTML',
                name: 'index.html',
                language: 'html',
                content: '<h1 class="fg:red">Hello</h1>'
            }
        ]
    }), env)

    assert.equal(createResponse.status, 201)
    const { id } = await createResponse.json()
    assert.match(id, /^[A-Za-z0-9_-]{8,48}$/)
    assert.equal(env.PLAY_SHARES.puts[0].options?.expirationTtl, 3600)

    const getResponse = await getPlayShare(id, createRequest(`/api/play/shares/${id}`), env)

    assert.equal(getResponse.status, 200)
    assert.equal(getResponse.headers.get('cache-control'), 'public, max-age=60')
    const body = await getResponse.json()
    assert.equal(body.version, 1)
    assert.equal(body.files[0].title, 'HTML')
    assert.equal(body.files[0].content, '<h1 class="fg:red">Hello</h1>')
})

test('uses the default Play share TTL when the env var is unset', async () => {
    const env = createEnv({ PLAY_SHARE_TTL_SECONDS: undefined })
    const response = await createPlayShare(createJsonRequest('/api/play/shares', {
        files: [
            {
                title: 'HTML',
                content: '<p>Hello</p>'
            }
        ]
    }), env)

    assert.equal(response.status, 201)
    assert.equal(env.PLAY_SHARES.puts[0].options?.expirationTtl, 60 * 60 * 24 * 30)
})

test('returns 404 for a missing Play share', async () => {
    const env = createEnv()
    const response = await getPlayShare('missing-id', createRequest('/api/play/shares/missing-id'), env)

    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { error: 'Share not found' })
})

test('rejects invalid share JSON', async () => {
    const env = createEnv()
    const response = await createPlayShare(new Request('https://css.master.co/api/play/shares', {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: '{'
    }), env)

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'Invalid JSON payload' })
})

test('rejects disallowed origins', async () => {
    const env = createEnv({ PLAY_ALLOWED_ORIGINS: 'https://css.master.co' })
    const response = await createPlayShare(createJsonRequest('/api/play/shares', {
        files: [
            {
                title: 'HTML',
                content: ''
            }
        ]
    }, {
        origin: 'https://example.com'
    }), env)

    assert.equal(response.status, 403)
    assert.deepEqual(await response.json(), { error: 'Origin not allowed' })
})

test('rejects oversized share payloads', async () => {
    const env = createEnv()
    const body = 'x'.repeat(256 * 1024 + 1)
    const response = await createPlayShare(new Request('https://css.master.co/api/play/shares', {
        method: 'POST',
        headers: {
            'content-length': String(body.length)
        },
        body
    }), env)

    assert.equal(response.status, 413)
    assert.deepEqual(await response.json(), { error: 'Share payload is too large' })
})

test('rejects invalid file data', async () => {
    const env = createEnv()
    const response = await createPlayShare(createJsonRequest('/api/play/shares', {
        files: [
            {
                content: 'missing title'
            }
        ]
    }), env)

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'Invalid file data' })
})

type TestPlayEnv = Omit<PlayEnv, 'PLAY_SHARES'> & { PLAY_SHARES: MemoryKV }

function createEnv(overrides: Partial<Omit<PlayEnv, 'PLAY_SHARES'>> = {}): TestPlayEnv {
    return {
        PLAY_SHARES: new MemoryKV(),
        PLAY_ALLOWED_ORIGINS: 'https://css.master.co,http://localhost:3000',
        PLAY_SHARE_TTL_SECONDS: '3600',
        ...overrides
    }
}

function createJsonRequest(pathname: string, body: unknown, headers: HeadersInit = {}) {
    return createRequest(pathname, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            ...headers
        },
        body: JSON.stringify(body)
    })
}

function createRequest(pathname: string, init?: RequestInit) {
    return new Request(`https://css.master.co${pathname}`, init)
}
