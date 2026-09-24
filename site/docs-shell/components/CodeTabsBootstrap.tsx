'use client'

import Script from 'next/script'
import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => undefined

function codeTabsBootstrap() {
  const activeClasses = ['text:strong', 'untouchable', 'rbl:lg+div']
  const inactiveClasses = ['bb:1px', 'text:body', 'text:strong:hover']
  const activeNextClasses = ['br:1px', 'rbr:lg']
  const activePreviousClasses = ['rbl:lg']
  const indexedInactiveClasses = ['bl:1px']
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

  const toggleClasses = (element: Element, classes: string[], enabled: boolean) => {
    for (const className of classes) {
      element.classList.toggle(className, enabled)
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
    root.querySelector<HTMLElement>('[data-code-tabs-controls]')?.classList.toggle('rbr:lg', currentName === firstName)

    triggers.forEach((trigger, index) => {
      const name = trigger.dataset.codeTabsTabName
      const active = currentName === name

      trigger.classList.toggle('active', active)
      trigger.classList.toggle('active-next', names[index + 1] === currentName)
      trigger.classList.toggle('active-previous', names[index - 1] === currentName)
      toggleClasses(trigger, activeClasses, active)
      toggleClasses(trigger, inactiveClasses, !active)
      toggleClasses(trigger, activeNextClasses, names[index + 1] === currentName)
      toggleClasses(trigger, activePreviousClasses, names[index - 1] === currentName)
      toggleClasses(trigger, indexedInactiveClasses, !active && index > 0)
    })

    root.querySelectorAll<HTMLElement>('[data-code-tabs-icon-name]').forEach((icon) => {
      const active = icon.dataset.codeTabsIconName === currentName
      icon.classList.toggle('active', active)
      icon.classList.toggle('hidden', !active)
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
