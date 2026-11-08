/** The Master CSS 2.0 film, published on YouTube and embedded without cookies until it plays. */
export const promoVideo = {
  id: 'lQLEHN-AiBw',
  title: 'Master CSS 2.0 — Your project, understood.',
  watchUrl: 'https://youtu.be/lQLEHN-AiBw'
} as const

export const promoPlayerOrigin = 'https://www.youtube-nocookie.com'

/**
 * The privacy-enhanced player starts playing as soon as a reader asks for it. With an `origin`, it also reports its
 * state to that page through `postMessage`, without loading YouTube's IFrame API script.
 */
export function promoEmbedUrl({ autoplay = true, origin }: { autoplay?: boolean, origin?: string } = {}) {
  const params = new URLSearchParams({ rel: '0', playsinline: '1' })
  if (autoplay) params.set('autoplay', '1')
  if (origin) {
    params.set('enablejsapi', '1')
    params.set('origin', origin)
  }
  return `${promoPlayerOrigin}/embed/${promoVideo.id}?${params}`
}

/** YouTube's player state for a video that played to its end. */
const endedState = 0

/** Whether a message from the player says the video ended; it reports state changes and periodic info. */
export function isPromoEndedMessage(data: unknown) {
  let message: any
  try {
    message = typeof data === 'string' ? JSON.parse(data) : data
  } catch {
    return false
  }
  if (message?.event === 'onStateChange') return message.info === endedState
  if (message?.event === 'infoDelivery') return message.info?.playerState === endedState
  return false
}

/** A plain click plays here; a modified click keeps the link's own behavior, such as a new tab. */
export function isPlainClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}
