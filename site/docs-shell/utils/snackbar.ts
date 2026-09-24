import clsx from 'clsx'

let lastSnackbarClose: (() => void) | null

export async function snackbar(text: string, { placement }: any = {}) {
  if (lastSnackbarClose) {
    lastSnackbarClose()
    lastSnackbarClose = null
  }
  const element = document.createElement('div')
  element.className = clsx(
    'fixed left right z:1060 w:fit-content m:auto p:var(--spacing-sm)|var(--spacing-md) r-lg outline:1px|solid|var(--color-line-muted) font-xs background-color:var(--color-float) text-strong cursor:pointer',
    {
      'top:20px': placement === 'top',
      'bottom:20px': !placement
    }
  )
  element.style.boxShadow = `0px 0.2px 0.6px rgba(0, 0, 0, 0.015), 0px 0.5px 1.3px rgba(0, 0, 0, 0.022), 0px 1px 2.3px rgba(0, 0, 0, 0.028), 0px 1.6px 3.9px rgba(0, 0, 0, 0.032), 0px 2.6px 6.3px rgba(0, 0, 0, 0.038), 0px 4.6px 11.1px rgba(0, 0, 0, 0.045), 0px 10px 24px rgba(0, 0, 0, 0.06)`
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
  await element.animate([
    { transform: 'translateY(100%) scale(0)', opacity: 0 },
    { transform: 'translateY(0%) scale(1)', opacity: 1 }
  ], {
    duration: 200,
    easing: 'ease'
  }).finished
  setTimeout(close, 3000)
}
