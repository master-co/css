import { createPlayShare, handlePlayOptions, type PlayEnv } from '../../../../site/play-api/route-handlers'

interface PagesContext {
    request: Request
    env: PlayEnv
}

export function onRequestPost({ request, env }: PagesContext) {
    return createPlayShare(request, env)
}

export function onRequestOptions({ request, env }: PagesContext) {
    return handlePlayOptions(request, env)
}
