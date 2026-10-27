/** Code blocks render as static markup; these delegated handlers switch tabs and copy code. */

const tabChange = 'site-code-tabs:change'
const resetTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>()

function tabsOf(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLButtonElement>('[data-code-tabs-tab-name]')]
}

function selectTab(root: HTMLElement, name: string) {
  const tabs = tabsOf(root)
  if (!tabs.some(tab => tab.dataset.codeTabsTabName === name)) return
  root.dataset.codeTabsCurrentName = name
  for (const tab of tabs) {
    const active = tab.dataset.codeTabsTabName === name
    tab.setAttribute('aria-selected', String(active))
    tab.tabIndex = active ? 0 : -1
  }
  root.querySelectorAll<HTMLElement>('[data-code-tabs-panel-name]').forEach(panel => {
    const active = panel.dataset.codeTabsPanelName === name
    panel.hidden = !active
    panel.classList.toggle('display:none', !active)
  })
  const copy = root.querySelector<HTMLButtonElement>('[data-code-copy]')
  if (copy) {
    copy.dataset.codeCopy = name
    copy.ariaLabel = copy.title = `Copy ${name}`
  }
}

/** Tab sets with one storage key share a choice, such as the package manager. */
function chooseTab(root: HTMLElement, name: string) {
  const key = root.dataset.codeTabsStorageKey
  if (!key) return selectTab(root, name)
  try { localStorage.setItem(key, JSON.stringify(name)) } catch { /* Storage may be unavailable. */ }
  window.dispatchEvent(new CustomEvent(tabChange, { detail: { key, name } }))
}

function syncTabs(key: string, name: string) {
  document.querySelectorAll<HTMLElement>('[data-code-tabs]').forEach(root => {
    if (root.dataset.codeTabsStorageKey === key) selectTab(root, name)
  })
}

/** Mirror `highlightedCodeText`: Shiki lines without trailing notation whitespace. */
function codeText(button: HTMLButtonElement) {
  if (button.dataset.codeCopyText !== undefined) return button.dataset.codeCopyText
  const container = button.closest<HTMLElement>('[data-code-tabs]')
  const scope = container?.querySelector<HTMLElement>('[data-code-tabs-panel-name]:not([hidden])') ?? button.closest<HTMLElement>('.code')
  return [...scope?.querySelectorAll<HTMLElement>('.line') ?? []].map(line => (line.textContent ?? '').replace(/[\t ]+$/u, '')).join('\n')
}

function showCopyStatus(button: HTMLButtonElement, status: 'idle' | 'copied' | 'error') {
  const element = button.parentElement?.querySelector<HTMLElement>('.code-copy-status')
  const name = button.dataset.codeCopy
  if (element) {
    element.textContent = status === 'copied' ? `${name || 'Code'} copied` : status === 'error' ? 'Clipboard unavailable. Select the code to copy it.' : ''
    element.toggleAttribute('data-error', status === 'error')
  }
  button.toggleAttribute('data-copied', status === 'copied')
  clearTimeout(resetTimers.get(button))
  if (status !== 'idle') resetTimers.set(button, setTimeout(() => showCopyStatus(button, 'idle'), status === 'error' ? 5000 : 2000))
}

async function copy(button: HTMLButtonElement) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
    await navigator.clipboard.writeText(codeText(button))
    showCopyStatus(button, 'copied')
  } catch {
    showCopyStatus(button, 'error')
  }
}

document.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return
  const copyButton = event.target.closest<HTMLButtonElement>('[data-code-copy]')
  if (copyButton) return void copy(copyButton)
  const tab = event.target.closest<HTMLButtonElement>('[data-code-tabs-tab-name]')
  const root = tab?.closest<HTMLElement>('[data-code-tabs]')
  if (tab && root) chooseTab(root, tab.dataset.codeTabsTabName!)
})

document.addEventListener('keydown', event => {
  if (!(event.target instanceof HTMLElement) || !event.target.matches('[data-code-tabs-tab-name]')) return
  const root = event.target.closest<HTMLElement>('[data-code-tabs]')
  if (!root) return
  const tabs = tabsOf(root)
  const index = tabs.indexOf(event.target as HTMLButtonElement)
  const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key]
  if (next === undefined) return
  event.preventDefault()
  chooseTab(root, tabs[next].dataset.codeTabsTabName!)
  tabs[next].focus()
})

window.addEventListener(tabChange, event => {
  const { key, name } = (event as CustomEvent<{ key: string, name: string }>).detail
  syncTabs(key, name)
})

window.addEventListener('storage', event => {
  if (!event.key || event.newValue === null) return
  try {
    const name = JSON.parse(event.newValue)
    if (typeof name === 'string') syncTabs(event.key, name)
  } catch { /* Not a code tab choice. */ }
})

// The bootstrap script restored persisted choices before paint; align their copy labels.
document.querySelectorAll<HTMLElement>('[data-code-tabs][data-code-tabs-storage-key]').forEach(root => {
  if (root.dataset.codeTabsCurrentName) selectTab(root, root.dataset.codeTabsCurrentName)
})
