'use client'

import '~/site/styles/docs-shell/header.css'
import Header from './Header'
import HeaderNav from './HeaderNav'
import LanguageButton from './LanguageButton'
import { IconChevronDown, IconListSearch } from '@tabler/icons-react'
import DocVersionSelect from './DocVersionSelect'
import Link from './Link'
import DocMenuButton from './DocMenuButton'
import { useTranslation } from '../contexts/i18n'
import HeaderContent from './HeaderContent'
import SearchButton from './SearchButton'
import isDateWithinSevenDays from '../utils/is-date-within-seven-days'
import DocBadge from './DocBadge'
import { useApp } from '../contexts/app'
import clsx from 'clsx'
import { useLocale } from '../contexts/locale'
import { usePathname } from '../layouts/root'

export default function DocHeader(props: any) {
  const $ = useTranslation()
  const app = useApp()
  const tw = useLocale() === 'tw'
  const home = usePathname() === (tw ? '/tw' : '/')
  const { primaryNavClassName, documentNavigation, documentNavigationTitle, ...headerProps } = props
  return (
    <Header aria-label={tw ? '主要導覽' : 'Main navigation'} {...headerProps}>
      <HeaderContent>
        <DocMenuButton className="(margin-left:-1.25rem) hidden@md app-header-icon app-header-menu" documentNavigation={documentNavigation} documentNavigationTitle={documentNavigationTitle} />
        <Link href={'/'} className="mx-auto@media((width<64rem)) app-header-logo" aria-label={tw ? 'Master CSS 首頁' : 'Master CSS home'} onContextMenu={(e: any) => {
          e.preventDefault()
          location.assign('/brand')
        }}>
          {<app.Logotype style={{ height: 20, width: 'auto' }} aria-hidden="true" />}
        </Link>
        <label className={clsx('relative (gap:0.313rem) (margin-left:1.875rem) (font-weight:460) hidden@media((width<64rem)) app-header-nav app-header-version', !app.versions.length && 'fg-text-body:hover!')}>
          {app.versions.length
            ? <>
              v{import.meta.env.PUBLIC_VERSION}
              <DocVersionSelect />
              <IconChevronDown aria-hidden="true" className="(height:1em) (width:1em) (margin-right:-0.188rem) (stroke-width:1.5)" />
            </>
            : <>v{import.meta.env.PUBLIC_VERSION}</>}
        </label>
        {app.navs.map(({ Icon, fullName, ...eachLink }: any) => <HeaderNav className={clsx('hidden@media((width<64rem)) app-header-primary-nav', primaryNavClassName)} key={eachLink.name} {...eachLink}>
          {$(eachLink.name)}
          {eachLink.date && isDateWithinSevenDays(eachLink.date) && <DocBadge className="ml-3xs" $color="primary" $size="xs">New</DocBadge>}
        </HeaderNav>)}
        {app.communityNavs?.map(({ Icon, disabled, fullName, ...eachLink }: any, index: number) => (
          <Link
            {...eachLink}
            aria-label={fullName || eachLink.name}
            className={clsx(index === 0 && 'app-header-community-first', 'app-header-community app-header-icon', { 'fg-text-disabled': disabled, 'app-header-github': eachLink.name === 'GitHub' })}
            disabled={disabled}
            key={eachLink.name}
          >
            {Icon && <Icon width="22" height="22" strokeWidth="1.2" aria-hidden="true" />}
          </Link>
        ))}
        {app.communityNavs?.length ? <div className='(height:1em) w(1) mx-md bg-line-divider hidden@media((width<64rem)) app-header-divider'></div> : null}
        <LanguageButton className={clsx('hidden@media((width<64rem)) app-header-icon app-header-language', (documentNavigation || home) && '(margin-right:-0.188rem)')} />
        <SearchButton className={clsx('(margin-right:-1.25rem)@media((width<64rem)) app-header-icon app-header-search', (documentNavigation || home) && 'hidden@md')}>
          <IconListSearch width="22" height="22" strokeWidth="1.2" aria-hidden="true" />
        </SearchButton>
      </HeaderContent>
    </Header>
  )
}
