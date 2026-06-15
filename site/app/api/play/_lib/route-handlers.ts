import { getCloudflareContext } from '@opennextjs/cloudflare'

interface PlayKVNamespace {
    get(key: string): Promise<string | null>
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
}

export interface PlayEnv {
    PLAY_SHARES?: PlayKVNamespace
    PLAY_ALLOWED_ORIGINS?: string
    PLAY_SHARE_TTL_SECONDS?: string
}

interface PlayShareFile {
    title?: string
    name?: string
    language?: string
    content?: string
}

interface PlayShareRouteProps {
    params: Promise<{ id?: string }> | { id?: string }
}

const shareKeyPrefix = 'share:'
const maxPayloadBytes = 256 * 1024
const maxFiles = 8
const defaultShareTtlSeconds = 60 * 60 * 24 * 30
const shareIdPattern = /^[A-Za-z0-9_-]{8,48}$/
const validLanguages = new Set(['html', 'javascript', 'css', 'plaintext'])
const defaultAllowedOrigins = [
    'https://css.master.co',
    'https://rc.css.master.co',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8787',
    'http://127.0.0.1:8787',
    'https://localhost:8787',
    'https://127.0.0.1:8787'
]

export async function OPTIONS(request: Request) {
    return handlePlayOptions(request, await getPlayEnv())
}

export async function GET_HEALTH(request: Request) {
    return getPlayHealth(request, await getPlayEnv())
}

export async function POST_SHARES(request: Request) {
    return createPlayShare(request, await getPlayEnv())
}

export async function GET_SHARE(request: Request, props: PlayShareRouteProps) {
    const env = await getPlayEnv()
    const { id = '' } = await props.params
    if (!shareIdPattern.test(id)) {
        return json({ error: 'Not found' }, request, env, 404)
    }
    return getPlayShare(id, request, env)
}

export function handlePlayOptions(request: Request, env: PlayEnv = {}) {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) })
}

export function getPlayHealth(request: Request, env: PlayEnv = {}) {
    return json({ ok: true }, request, env)
}

export async function createPlayShare(request: Request, env: PlayEnv) {
    const store = env.PLAY_SHARES
    if (!store) {
        return json({ error: 'Play shares storage is not configured' }, request, env, 500)
    }

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

    const id = await createUniqueShareId(store)
    const expirationTtl = getExpirationTtl(env)
    await store.put(shareKeyPrefix + id, record, expirationTtl ? { expirationTtl } : undefined)

    return json({ id }, request, env, 201)
}

export async function getPlayShare(id: string, request: Request, env: PlayEnv) {
    const store = env.PLAY_SHARES
    if (!store) {
        return json({ error: 'Play shares storage is not configured' }, request, env, 500)
    }

    const value = await store.get(shareKeyPrefix + id)
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

async function getPlayEnv(): Promise<PlayEnv> {
    const { env } = await getCloudflareContext({ async: true })
    return env as PlayEnv
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

async function createUniqueShareId(store: PlayKVNamespace) {
    for (let attempt = 0; attempt < 3; attempt++) {
        const id = createShareId()
        if (!await store.get(shareKeyPrefix + id)) {
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

function getExpirationTtl(env: PlayEnv) {
    const value = Number(env.PLAY_SHARE_TTL_SECONDS)
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : defaultShareTtlSeconds
}

function json(value: unknown, request: Request, env: PlayEnv, status = 200) {
    return new Response(JSON.stringify(value), {
        status,
        headers: {
            ...corsHeaders(request, env),
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store'
        }
    })
}

function corsHeaders(request: Request, env: PlayEnv) {
    const origin = request.headers.get('origin')
    const allowedOrigin = getAllowedOrigin(origin, env)
    return {
        'access-control-allow-origin': allowedOrigin || 'null',
        'access-control-allow-methods': 'GET,POST,OPTIONS',
        'access-control-allow-headers': 'content-type',
        'vary': 'Origin'
    }
}

function isAllowedOrigin(request: Request, env: PlayEnv) {
    const origin = request.headers.get('origin')
    return !origin || Boolean(getAllowedOrigin(origin, env))
}

function getAllowedOrigin(origin: string | null, env: PlayEnv) {
    if (!origin) return '*'
    const normalizedOrigin = normalizeOrigin(origin)
    if (!normalizedOrigin) return ''
    const allowedOrigins = (env.PLAY_ALLOWED_ORIGINS || defaultAllowedOrigins.join(','))
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)

    if (allowedOrigins.includes('*')) return normalizedOrigin
    return allowedOrigins.some((allowedOrigin) => normalizeOrigin(allowedOrigin) === normalizedOrigin)
        ? normalizedOrigin
        : ''
}

function normalizeOrigin(origin: string | null) {
    if (!origin) return ''
    try {
        return new URL(origin).origin
    } catch {
        return ''
    }
}
