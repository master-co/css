'use client'

// `.app-wrapper` sets the homepage sections' column gutters; the homepage loads it through this header.
import '~/site/styles/docs-shell/wrapper.css'
import Header from './Header'
import HeaderNav from './HeaderNav'
import LanguageButton from './LanguageButton'
import { IconChevronDown, IconSearch } from '@tabler/icons-react'
import DocVersionSelect from './DocVersionSelect'
import Link from './Link'
import DocMenuButton from './DocMenuButton'
import { useTranslation } from '../contexts/i18n'
import SearchButton from './SearchButton'
import isDateWithinSevenDays from '../utils/is-date-within-seven-days'
import DocBadge from './DocBadge'
import { useApp } from '../contexts/app'
import { useLocale } from '../contexts/locale'
import { usePathname } from '../layouts/root'
import type { DocSidebarProps } from './DocSidebar'

export interface DocHeaderProps {
  className?: string
  /** See `Header`: overlays the page and slides away while reading down. */
  stickable?: boolean
  transitionAtTop?: boolean
  /** Chapters the compact menu lists. */
  documentNavigation?: DocSidebarProps['pageCategories']
  documentNavigationTitle?: string
  /** Accepted for section shells; the header always spans the page. */
  contained?: boolean
}

export default function DocHeader({ className, stickable, transitionAtTop, documentNavigation, documentNavigationTitle }: DocHeaderProps) {
  const $ = useTranslation()
  const app = useApp()
  const tw = useLocale() === 'tw'
  const home = usePathname() === (tw ? '/tw' : '/')
  const version = `v${import.meta.env.PUBLIC_VERSION}`
  return (
    <Header className={className} stickable={stickable} transitionAtTop={transitionAtTop}>
      <DocMenuButton className="ui-header-menu" documentNavigation={documentNavigation} documentNavigationTitle={documentNavigationTitle} />
      <Link href={'/'} className="ui-header-brand" aria-label={tw ? 'Master CSS 首頁' : 'Master CSS home'} onContextMenu={(e: any) => {
        e.preventDefault()
        location.assign('/brand')
      }}>
        {<app.Logotype style={{ height: 20, width: 'auto' }} aria-hidden="true" />}
      </Link>
      {app.versions.length
        ? <label className="ui-version">
          {version}
          <DocVersionSelect aria-label={$('Version')} />
          <IconChevronDown aria-hidden="true" stroke={1.5} />
        </label>
        : <span className="ui-version">{version}</span>}
      <nav className="ui-header-nav" aria-label={tw ? '主要導覽' : 'Main navigation'}>
        {app.navs.map(({ Icon, fullName, ...eachLink }: any) => <HeaderNav key={eachLink.name} {...eachLink}>
          {$(eachLink.name)}
          {eachLink.date && isDateWithinSevenDays(eachLink.date) && <DocBadge>New</DocBadge>}
        </HeaderNav>)}
      </nav>
      <div className="ui-header-end">
        {/* Search leads the end group as a quiet pill: the glass and its shortcut. The homepage leaves it to the compact header. */}
        <SearchButton className="ui-header-search" data-compact={home ? '' : undefined}>
          <IconSearch width="16" height="16" strokeWidth="1.5" aria-hidden="true" />
          <kbd className="ui-kbd" aria-hidden="true">⌘K</kbd>
        </SearchButton>
        {app.communityNavs?.map(({ Icon, disabled, fullName, ...eachLink }: any) => (
          <Link
            {...eachLink}
            aria-label={fullName || eachLink.name}
            className="ui-button"
            data-variant="quiet"
            data-shape="icon"
            data-size="sm"
            data-disabled={disabled || undefined}
            disabled={disabled}
            key={eachLink.name}
          >
            {Icon && <Icon width="18" height="18" strokeWidth="1.5" aria-hidden="true" />}
            <span className="ui-tooltip" data-side="bottom" aria-hidden="true">{fullName || eachLink.name}</span>
          </Link>
        ))}
        {app.communityNavs?.length ? <span className="ui-header-divider" aria-hidden="true" /> : null}
        <LanguageButton />
      </div>
    </Header>
  )
}
