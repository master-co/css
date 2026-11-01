let lastSnackbarClose: (() => void) | null

export async function snackbar(text: string, { placement }: any = {}) {
  if (lastSnackbarClose) {
    lastSnackbarClose()
    lastSnackbarClose = null
  }
  // A floating `ui-sheet`; placement is inline so a message never needs a utility class the page has not generated.
  const element = document.createElement('div')
  element.className = 'ui-sheet'
  element.dataset.elevation = '3'
  element.setAttribute('role', 'status')
  Object.assign(element.style, {
    position: 'fixed', left: '0', right: '0', [placement === 'top' ? 'top' : 'bottom']: '20px', zIndex: '1060',
    width: 'fit-content', maxWidth: 'calc(100vw - 2rem)', margin: 'auto', padding: '.625rem 1rem', overflowWrap: 'anywhere',
    color: 'var(--ui-text-strong)', fontSize: '.75rem', lineHeight: '1.5', cursor: 'pointer'
  })
  element.innerHTML = text
  document.body.appendChild(element)
  let closed = false
  const close = lastSnackbarClose = async () => {
    if (closed) return
    closed = true
    await element.animate([
      { opacity: 1 },
      { opacity: 0 }
    ], { duration: 100 }).finished
    element.remove()
  }
  element.onclick = close
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) await element.animate([
    { transform: 'translateY(100%) scale(0)', opacity: 0 },
    { transform: 'translateY(0%) scale(1)', opacity: 1 }
  ], {
    duration: 200,
    easing: 'ease'
  }).finished
  setTimeout(close, 3000)
}
