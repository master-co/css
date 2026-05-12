interface KVNamespace {
    get(key: string): Promise<string | null>
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
}

interface Env {
    PLAY_SHARES: KVNamespace
    PLAY_ALLOWED_ORIGINS?: string
    PLAY_SHARE_TTL_SECONDS?: string
}

interface PlayShareFile {
    title?: string
    name?: string
    language?: string
    content?: string
}

const apiPrefix = '/api/play'
const shareKeyPrefix = 'share:'
const maxPayloadBytes = 256 * 1024
const maxFiles = 8
const validLanguages = new Set(['html', 'javascript', 'css', 'plaintext'])

export default {
    async fetch(request: Request, env: Env) {
        const url = new URL(request.url)
        const pathname = url.pathname.replace(/\/+$/, '') || '/'

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(request, env) })
        }

        if (request.method === 'GET' && pathname === `${apiPrefix}/health`) {
            return json({ ok: true }, request, env)
        }

        if (request.method === 'POST' && pathname === `${apiPrefix}/shares`) {
            return createShare(request, env)
        }

        const shareMatch = pathname.match(/^\/api\/play\/shares\/([A-Za-z0-9_-]{8,48})$/)
        if (request.method === 'GET' && shareMatch) {
            return getShare(shareMatch[1], request, env)
        }

        return json({ error: 'Not found' }, request, env, 404)
    }
}

async function createShare(request: Request, env: Env) {
    if (!isAllowedOrigin(request, env)) {
        return json({ error: 'Origin not allowed' }, request, env, 403)
    }

    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > maxPayloadBytes) {
        return json({ error: 'Share payload is too large' }, request, env, 413)
    }

    let body: unknown
    let bodyText: string
    try {
        bodyText = await request.text()
        if (new TextEncoder().encode(bodyText).length > maxPayloadBytes) {
            return json({ error: 'Share payload is too large' }, request, env, 413)
        }
        body = JSON.parse(bodyText)
    } catch {
        return json({ error: 'Invalid JSON payload' }, request, env, 400)
    }

    const files = validateFiles(body)
    if ('error' in files) {
        return json({ error: files.error }, request, env, 400)
    }

    const record = JSON.stringify({
        version: 1,
        createdAt: new Date().toISOString(),
        files: files.value
    })

    if (new TextEncoder().encode(record).length > maxPayloadBytes) {
        return json({ error: 'Share payload is too large' }, request, env, 413)
    }

    const id = await createUniqueShareId(env)
    const expirationTtl = getExpirationTtl(env)
    await env.PLAY_SHARES.put(shareKeyPrefix + id, record, expirationTtl ? { expirationTtl } : undefined)

    return json({ id }, request, env, 201)
}

async function getShare(id: string, request: Request, env: Env) {
    const value = await env.PLAY_SHARES.get(shareKeyPrefix + id)
    if (!value) {
        return json({ error: 'Share not found' }, request, env, 404)
    }

    return new Response(value, {
        headers: {
            ...corsHeaders(request, env),
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'public, max-age=60'
        }
    })
}

function validateFiles(body: unknown): { value: PlayShareFile[] } | { error: string } {
    if (!body || typeof body !== 'object' || !Array.isArray((body as { files?: unknown }).files)) {
        return { error: 'Missing files' }
    }

    const files = (body as { files: unknown[] }).files
    if (!files.length || files.length > maxFiles) {
        return { error: 'Invalid file count' }
    }

    const normalizedFiles: PlayShareFile[] = []
    for (const file of files) {
        if (!file || typeof file !== 'object') {
            return { error: 'Invalid file' }
        }

        const source = file as PlayShareFile
        const title = normalizeString(source.title, 64)
        const name = normalizeString(source.name, 128)
        const content = normalizeString(source.content, maxPayloadBytes)
        const language = validLanguages.has(source.language || '') ? source.language : 'plaintext'

        if (!title || typeof content !== 'string') {
            return { error: 'Invalid file data' }
        }

        normalizedFiles.push({ title, name, language, content })
    }

    return { value: normalizedFiles }
}

function normalizeString(value: unknown, maxLength: number) {
    if (typeof value !== 'string') return ''
    return value.slice(0, maxLength)
}

async function createUniqueShareId(env: Env) {
    for (let attempt = 0; attempt < 3; attempt++) {
        const id = createShareId()
        if (!await env.PLAY_SHARES.get(shareKeyPrefix + id)) {
            return id
        }
    }
    return createShareId()
}

function createShareId() {
    const bytes = crypto.getRandomValues(new Uint8Array(12))
    let value = ''
    for (const byte of bytes) {
        value += String.fromCharCode(byte)
    }
    return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function getExpirationTtl(env: Env) {
    const value = Number(env.PLAY_SHARE_TTL_SECONDS)
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined
}

function json(value: unknown, request: Request, env: Env, status = 200) {
    return new Response(JSON.stringify(value), {
        status,
        headers: {
            ...corsHeaders(request, env),
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store'
        }
    })
}

function corsHeaders(request: Request, env: Env) {
    const origin = request.headers.get('origin')
    const allowedOrigin = getAllowedOrigin(origin, env)
    return {
        'access-control-allow-origin': allowedOrigin || 'null',
        'access-control-allow-methods': 'GET,POST,OPTIONS',
        'access-control-allow-headers': 'content-type',
        'vary': 'Origin'
    }
}

function isAllowedOrigin(request: Request, env: Env) {
    const origin = request.headers.get('origin')
    return !origin || Boolean(getAllowedOrigin(origin, env))
}

function getAllowedOrigin(origin: string | null, env: Env) {
    if (!origin) return '*'
    const allowedOrigins = (env.PLAY_ALLOWED_ORIGINS || 'https://css.master.co')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)

    if (allowedOrigins.includes('*')) return origin
    return allowedOrigins.includes(origin) ? origin : ''
}
