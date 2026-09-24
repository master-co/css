'use client'

import type { KeyboardEvent } from 'react'
import clsx from 'clsx'
import WindowControls from './WindowControls'
import FileIcon from './FileIcon'
import CodeCopyButton from './CodeCopyButton'

type Tab = { name?: string, lang: string, ext?: string }

type Props = {
  tabs: Tab[]
  currentName?: string
  copyText: string
  className?: string
  showControls?: boolean
  copyable?: boolean
  idPrefix?: string
  onTabChange?: (name: string) => void
}

export default function CodeTabBar({ tabs, currentName, copyText, className, showControls, copyable = true, idPrefix, onTabChange }: Props) {
  const interactive = Boolean(onTabChange)

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number
    switch (event.key) {
      case 'ArrowRight': nextIndex = (index + 1) % tabs.length; break
      case 'ArrowLeft': nextIndex = (index - 1 + tabs.length) % tabs.length; break
      case 'Home': nextIndex = 0; break
      case 'End': nextIndex = tabs.length - 1; break
      default: return
    }
    event.preventDefault()
    onTabChange?.(tabs[nextIndex].name ?? tabs[nextIndex].lang)
    event.currentTarget.closest('[role="tablist"]')?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus()
  }

  return <div className={clsx('code-bar', className)}>
    {showControls && <div className="code-window-controls" aria-hidden="true"><WindowControls /></div>}
    {interactive
      ? <div className="code-bar-tabs" role="tablist" aria-label="Code examples">
        {tabs.map(({ name, lang, ext }, index) => {
          const tabName = name ?? lang
          const active = currentName === tabName
          return <button
            key={tabName}
            type="button"
            className="code-tab"
            role="tab"
            id={`${idPrefix}-tab-${index}`}
            aria-controls={`${idPrefix}-panel-${index}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            data-code-tabs-tab-name={tabName}
            suppressHydrationWarning
            onClick={() => onTabChange?.(tabName)}
            onKeyDown={event => onTabKeyDown(event, index)}
          >
            <FileIcon name={tabName} lang={lang} ext={ext} className="code-tab-icon" />
            <span>{tabName}</span>
          </button>
        })}
      </div>
      : <div className="code-file-label">
        <FileIcon name={tabs[0]?.name ?? tabs[0]?.lang ?? ''} lang={tabs[0]?.lang} ext={tabs[0]?.ext} className="code-tab-icon" />
        <span>{tabs[0]?.name}</span>
      </div>}
    {copyable && <div className="code-bar-actions"><CodeCopyButton key={currentName} text={copyText} name={currentName} /></div>}
  </div>
}
