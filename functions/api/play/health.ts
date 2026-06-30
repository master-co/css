import { getPlayHealth, handlePlayOptions, type PlayEnv } from '../../../site/play-api/route-handlers'

interface PagesContext {
    request: Request
    env: PlayEnv
}

export function onRequestGet({ request, env }: PagesContext) {
    return getPlayHealth(request, env)
}

export function onRequestOptions({ request, env }: PagesContext) {
    return handlePlayOptions(request, env)
}
