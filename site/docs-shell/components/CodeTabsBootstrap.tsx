'use client'

import Script from 'next/script'
import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => undefined

function codeTabsBootstrap() {
  let attempts = 0

  const readStoredName = (key: string) => {
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return
      const parsed = JSON.parse(raw)
      return typeof parsed === 'string' ? parsed : undefined
    } catch {
      return
    }
  }

  const applyRoot = (root: HTMLElement) => {
    const storageKey = root.dataset.codeTabsStorageKey
    const triggers = Array.from(root.querySelectorAll<HTMLElement>('[data-code-tabs-tab-name]'))

    if (!storageKey || !triggers.length) return false

    const names = triggers
      .map((trigger) => trigger.dataset.codeTabsTabName)
      .filter((name): name is string => Boolean(name))
    const firstName = names[0]
    const storedName = readStoredName(storageKey)
    const currentName = storedName && names.includes(storedName) ? storedName : firstName

    if (!currentName) return false

    root.dataset.codeTabsCurrentName = currentName
    triggers.forEach((trigger) => {
      const active = trigger.dataset.codeTabsTabName === currentName
      trigger.setAttribute('aria-selected', String(active))
      trigger.tabIndex = active ? 0 : -1
    })

    root.querySelectorAll<HTMLElement>('[data-code-tabs-panel-name]').forEach((panel) => {
      const active = panel.dataset.codeTabsPanelName === currentName
      panel.hidden = !active
      panel.classList.toggle('hidden', !active)
    })

    return true
  }

  const run = () => {
    attempts += 1
    const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-code-tabs-storage-key]'))
    const pending = !roots.length || roots.some((root) => !applyRoot(root))

    if (pending && attempts < 120) {
      window.requestAnimationFrame(run)
    }
  }

  run()
}

export default function CodeTabsBootstrap() {
  const shouldRenderBootstrap = useSyncExternalStore(emptySubscribe, () => false, () => true)
  if (!shouldRenderBootstrap) return null

  return (
    /* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- Persisted code tabs must be marked before hydration. */
    <Script
      data-code-tabs-bootstrap
      id="code-tabs-bootstrap"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `(${codeTabsBootstrap.toString()})();`
      }}
    />
  )
}
