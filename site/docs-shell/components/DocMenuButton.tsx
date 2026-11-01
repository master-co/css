'use client'

import '~/site/styles/docs-shell/menu.css'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import Link from './Link'
import DocSidebar, { type DocSidebarProps } from './DocSidebar'
import SearchButton from './SearchButton'
import { IconArrowUpRight, IconMenu2, IconX } from '@tabler/icons-react'
import ThemeSelect from './ThemeSelect'
import DocVersionSelect from './DocVersionSelect'
import LanguageSelect from './LanguageSelect'
import { useLocale } from '../contexts/locale'
import { useTranslation } from '../contexts/i18n'
import { useApp } from '../contexts/app'

/** The compact header's menu: site sections, the section's chapters, community links and preferences in one sheet. */
export default function DocMenuButton({ className, documentNavigation, documentNavigationTitle }: {
  className?: string
  documentNavigation?: DocSidebarProps['pageCategories']
  documentNavigationTitle?: string
}) {
  const [opened, setOpened] = useState(false)
  const id = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const app = useApp()
  const tw = useLocale() === 'tw'
  const $ = useTranslation()
  const close = useCallback(() => {
    dialog.current?.close()
    setOpened(false)
    trigger.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!opened) return
    const element = dialog.current
    if (element && !element.open) element.showModal()
    const wide = matchMedia('(width >= 64rem)')
    const resize = () => { if (wide.matches) close() }
    wide.addEventListener('change', resize)
    return () => wide.removeEventListener('change', resize)
  }, [opened, close])

  return <>
    <button ref={trigger} type="button" className={clsx('ui-button', className)} data-variant="quiet" data-shape="icon"
      aria-label={$('Menu')} aria-expanded={opened} aria-haspopup="dialog" aria-controls={opened ? id : undefined}
      onClick={() => setOpened(value => !value)}>
      <IconMenu2 width="20" height="20" strokeWidth="1.5" aria-hidden="true" />
    </button>
    {opened && createPortal(<dialog ref={dialog} id={id} className="ui-dialog" data-variant="sheet" aria-labelledby={`${id}-title`} onCancel={event => { event.preventDefault(); close() }}>
      <div className="ui-dialog-bar">
        <button type="button" className="ui-button" data-variant="quiet" data-shape="icon" onClick={close} aria-label={tw ? '關閉選單' : 'Close menu'}><IconX width="20" height="20" strokeWidth="1.5" aria-hidden="true" /></button>
        <Link href="/" className="ui-header-brand" onClick={close} aria-label={tw ? 'Master CSS 首頁' : 'Master CSS home'}><app.Logotype style={{ height: 20, width: 'auto' }} aria-hidden="true" /></Link>
      </div>
      <div className="ui-dialog-body">
        <h2 className="sr-only" id={`${id}-title`}>{tw ? '網站導覽' : 'Navigation'}</h2>
        <SearchButton className="ui-search-trigger" />
        <nav className="ui-nav-group" aria-label={tw ? '主要導覽' : 'Main navigation'}>
          {app.navs.map(({ Icon, disabled, fullName, ...link }: any) => <Link className="ui-nav-link" current="true" ambiguous {...link} key={link.name} disabled={disabled} onClick={close}>
            {Icon && <Icon width="18" height="18" strokeWidth="1.5" aria-hidden="true" />}{$(fullName || link.name)}
          </Link>)}
        </nav>
        {documentNavigation?.length ? <details className="ui-disclosure" data-variant="rule" open>
          <summary>{$(documentNavigationTitle || 'Documentation')}<span className="ui-disclosure-meta">{tw ? '文件章節' : 'Chapters'}</span></summary>
          <DocSidebar embedded includeNestedPages pageCategories={documentNavigation} onNavigate={close} />
        </details> : null}
        {app.communityNavs?.length ? <nav className="ui-nav-group" aria-labelledby={`${id}-community`}>
          <h4 id={`${id}-community`}>{$('Community')}</h4>
          {app.communityNavs.map(({ Icon, disabled, fullName, ...link }: any) => <Link className="ui-nav-link" {...link} key={link.name} disabled={disabled} onClick={close}>
            {Icon && <Icon width="18" height="18" strokeWidth="1.5" aria-hidden="true" />}{$(fullName || link.name)}<IconArrowUpRight width="14" height="14" strokeWidth="1.5" aria-hidden="true" />
          </Link>)}
        </nav> : null}
        <section className="ui-dialog-fields" aria-labelledby={`${id}-system`}>
          <h4 id={`${id}-system`}>{$('System')}</h4>
          {app.versions.length > 0 && <label className="ui-field">{$('Version')}<DocVersionSelect data-variant={undefined} /></label>}
          <label className="ui-field">{$('Language')}<LanguageSelect data-variant={undefined} /></label>
          <label className="ui-field">{$('Theme')}<ThemeSelect data-variant={undefined} /></label>
        </section>
      </div>
    </dialog>, document.body)}
  </>
}
