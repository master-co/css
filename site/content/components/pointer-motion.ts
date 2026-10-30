/**
 * Whether a pointermove carries real motion. Once scrolling stops, WebKit repeats the resting pointer's
 * position as a pointermove, which must not read as a reader moving over a figure. Element handlers run
 * before this document listener, so `last` still holds the previous position when they ask.
 */
let last: { x: number, y: number } | undefined

if (typeof document !== 'undefined') {
  document.addEventListener('pointermove', (event) => { last = { x: event.clientX, y: event.clientY } }, { passive: true })
}

export function pointerMoved(event: { clientX: number, clientY: number }) {
  return !last || event.clientX !== last.x || event.clientY !== last.y
}
