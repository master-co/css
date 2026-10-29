'use client'

import '~/site/styles/docs-shell/menu.css'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import MenuButton from './MenuButton'
import Link from './Link'
import DocSidebar from './DocSidebar'
import SearchButton from './SearchButton'
import { IconArrowUpRight, IconChevronDown, IconChevronRight, IconLanguage, IconSelector, IconVersions, IconX } from '@tabler/icons-react'
import ThemeSelect from './ThemeSelect'
import ThemeIcon from './ThemeIcon'
import { useThemeMode } from '../contexts/theme-mode'
import DocVersionSelect from './DocVersionSelect'
import LanguageSelect from './LanguageSelect'
import { useLocale } from '../contexts/locale'
import i18n from '../common/i18n.config.js'
import { useTranslation } from '../contexts/i18n'
import { useApp } from '../contexts/app'

export default function DocMenuButton({ documentNavigation, documentNavigationTitle, ...props }: any) {
  const [opened, setOpened] = useState(false)
  const id = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const app = useApp()
  const themeMode = useThemeMode()
  const locale = useLocale()
  const tw = locale === 'tw'
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
    <MenuButton {...props} ref={trigger} type="button" aria-label={$('Menu')} aria-expanded={opened} aria-haspopup="dialog" aria-controls={opened ? id : undefined} opened={opened} onClick={() => setOpened(value => !value)} />
    {opened && createPortal(<dialog ref={dialog} id={id} className="doc-menu" aria-labelledby={`${id}-title`} onCancel={event => { event.preventDefault(); close() }}>
      <div className="doc-menu-topbar"><button type="button" onClick={close} aria-label={tw ? '關閉選單' : 'Close menu'}><IconX size={22} stroke={1.5} aria-hidden="true" /></button><Link href="/" onClick={close} aria-label="Master CSS home"><app.Logotype style={{ height: 20, width: 'auto' }} /></Link><span aria-hidden="true" /></div>
      <div className="doc-menu-inner">
        <div className="doc-menu-heading"><strong id={`${id}-title`}>{tw ? '網站導覽' : 'Navigation'}</strong></div>
        <SearchButton className="doc-menu-search" />
        <nav className="doc-menu-primary" aria-label={tw ? '主要導覽' : 'Main navigation'}>
          {app.navs.map(({ Icon, disabled, fullName, ...link }: any) => <Link className="doc-menu-link" {...link} key={link.name} disabled={disabled} onClick={close}>
            {Icon && <Icon size={22} stroke={1.5} aria-hidden="true" />}<span>{$(fullName || link.name)}</span><IconChevronRight size={17} stroke={1.5} aria-hidden="true" />
          </Link>)}
        </nav>
        {documentNavigation?.length > 0 && <details className="doc-menu-chapters" open>
          <summary>{$(documentNavigationTitle || 'Documentation')}<span>{tw ? '文件章節' : 'Chapters'}</span><IconChevronDown size={16} aria-hidden="true" /></summary>
          <DocSidebar embedded includeNestedPages pageCategories={documentNavigation} onNavigate={close} />
        </details>}
        {!!app.communityNavs?.length && <nav className="doc-menu-community" aria-label={$('Community')}>
          <h2>{$('Community')}</h2>
          {app.communityNavs.map(({ Icon, disabled, fullName, ...link }: any) => <Link className="doc-menu-link" {...link} key={link.name} disabled={disabled} onClick={close}>
            {Icon && <Icon size={22} stroke={1.5} aria-hidden="true" />}<span>{$(fullName || link.name)}</span><IconArrowUpRight size={16} stroke={1.5} aria-hidden="true" />
          </Link>)}
        </nav>}
        <section className="doc-menu-preferences" aria-label={$('System')}>
          <h2>{$('System')}</h2>
          <label className="doc-menu-preference" htmlFor={`${id}-version`}><IconVersions size={22} stroke={1.5} aria-hidden="true" /><span>{$('Version')}</span><span className="doc-menu-preference-value">v{import.meta.env.PUBLIC_VERSION}<DocVersionSelect id={`${id}-version`} /></span><IconSelector size={16} aria-hidden="true" /></label>
          <label className="doc-menu-preference" htmlFor={`${id}-language`}><IconLanguage size={22} stroke={1.5} aria-hidden="true" /><span>{$('Language')}</span><span className="doc-menu-preference-value">{i18n.nameOfLocale[locale as keyof typeof i18n.nameOfLocale]}<LanguageSelect id={`${id}-language`} /></span><IconSelector size={16} aria-hidden="true" /></label>
          <label className="doc-menu-preference" htmlFor={`${id}-theme`}><ThemeIcon width={22} height={22} strokeWidth={1.5} aria-hidden="true" /><span>{$('Theme')}</span><span className="doc-menu-preference-value">{$((themeMode.preference || 'system').replace(/^./, character => character.toUpperCase()))}<ThemeSelect id={`${id}-theme`} /></span><IconSelector size={16} aria-hidden="true" /></label>
        </section>
      </div>
    </dialog>, document.body)}
  </>
}
