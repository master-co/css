/**
 * Applies persisted code tab choices before paint. The document inlines it after
 * the content, so every tab set has already parsed.
 */
export function codeTabsBootstrap() {
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

  document.querySelectorAll<HTMLElement>('[data-code-tabs-storage-key]').forEach((root) => {
    const storedName = readStoredName(root.dataset.codeTabsStorageKey!)
    const triggers = Array.from(root.querySelectorAll<HTMLElement>('[data-code-tabs-tab-name]'))
    if (!storedName || !triggers.some((trigger) => trigger.dataset.codeTabsTabName === storedName)) return

    root.dataset.codeTabsCurrentName = storedName
    triggers.forEach((trigger) => {
      const active = trigger.dataset.codeTabsTabName === storedName
      trigger.setAttribute('aria-selected', String(active))
      trigger.tabIndex = active ? 0 : -1
    })

    root.querySelectorAll<HTMLElement>('[data-code-tabs-panel-name]').forEach((panel) => {
      const active = panel.dataset.codeTabsPanelName === storedName
      panel.hidden = !active
      panel.classList.toggle('display:none', !active)
    })
  })
}
