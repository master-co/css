/** The Master CSS 2.0 film, published on YouTube and embedded without cookies until it plays. */
export const promoVideo = {
  id: 'lQLEHN-AiBw',
  title: 'Master CSS 2.0 — Your project, understood.',
  watchUrl: 'https://youtu.be/lQLEHN-AiBw'
} as const

/** The privacy-enhanced player starts playing as soon as a reader asks for it. */
export function promoEmbedUrl({ autoplay = true }: { autoplay?: boolean } = {}) {
  const params = new URLSearchParams({ rel: '0', playsinline: '1' })
  if (autoplay) params.set('autoplay', '1')
  return `https://www.youtube-nocookie.com/embed/${promoVideo.id}?${params}`
}

/** A plain click plays here; a modified click keeps the link's own behavior, such as a new tab. */
export function isPlainClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}
