'use client'

import '~/site/styles/docs-shell/modal.css'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconX } from '@tabler/icons-react'
import clsx from 'clsx'
import { useLocale } from '../contexts/locale'

interface Props {
  children: ReactNode
  contentClass?: string
  backdropClick: () => void
  label?: string
}

/** Whether the latest input was a pointer or touch; keyboard use resets it. */
let pointerInput = false
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', () => { pointerInput = true }, true)
  document.addEventListener('keydown', () => { pointerInput = false }, true)
}

export default function Modal({ contentClass, backdropClick, children, label = 'Dialog' }: Props) {
  const [mounted, setMounted] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const dismiss = useRef(backdropClick)
  const tw = useLocale() === 'tw'
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { dismiss.current = backdropClick }, [backdropClick])
  useEffect(() => {
    if (!mounted || !dialog.current) return
    const element = dialog.current
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const cancel = (event: Event) => { event.preventDefault(); dismiss.current() }
    const backdrop = (event: MouseEvent) => { if (event.target === element) dismiss.current() }
    element.addEventListener('cancel', cancel)
    element.addEventListener('click', backdrop)
    if (!element.open) element.showModal()
    // A pointer or touch opening starts on the dialog itself, so no ring appears on its close control; a keyboard
    // opening keeps the browser's choice. The next Tab still reaches the close control first.
    const content = element.querySelector<HTMLElement>('.site-modal-content')
    if (pointerInput && content) {
      content.tabIndex = -1
      content.focus({ preventScroll: true })
    }
    return () => {
      element.removeEventListener('cancel', cancel)
      element.removeEventListener('click', backdrop)
      if (element.open) element.close()
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [mounted])

  return mounted && createPortal(<dialog ref={dialog} className="site-modal" aria-label={label}>
    <div className={clsx('site-modal-content', contentClass)}>
      <button type="button" className="site-modal-close" aria-label={tw ? '關閉視窗' : 'Close dialog'} onClick={() => dismiss.current()}><IconX size={20} stroke={1.5} aria-hidden="true" /></button>
      {children}
    </div>
  </dialog>, document.body)
}
