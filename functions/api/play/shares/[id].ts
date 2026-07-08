import { getPlayShare, handlePlayOptions, isValidShareId, type PlayEnv } from '../../../../site/play-api/route-handlers'

interface PagesContext {
  request: Request
  env: PlayEnv
  params: {
    id?: string | string[]
  }
}

export function onRequestGet({ request, env, params }: PagesContext) {
  const id = Array.isArray(params.id) ? params.id[0] : params.id || ''
  if (!isValidShareId(id)) {
    const headers = new Headers(handlePlayOptions(request, env).headers)
    headers.set('content-type', 'application/json; charset=utf-8')
    headers.set('cache-control', 'no-store')
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers
    })
  }
  return getPlayShare(id, request, env)
}

export function onRequestOptions({ request, env }: PagesContext) {
  return handlePlayOptions(request, env)
}
