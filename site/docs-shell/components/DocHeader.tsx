'use client'

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
import { useRouter } from 'next/navigation'

export default function DocHeader(props: any) {
  const $ = useTranslation()
  const app = useApp()
  const router = useRouter()
  const { primaryNavClassName, ...headerProps } = props
  return (
    <Header {...headerProps}>
      <HeaderContent>
        <DocMenuButton className="ml:-1.25rem hidden@md app-header-icon" locale={props.locale} />
        <Link href={'/'} className="mx:auto@media((width<64rem))" onContextMenu={(e: any) => {
          e.preventDefault()
          router.push('/brand')
        }}>
          {<app.Logotype style={{ height: 20, width: 'auto' }} />}
        </Link>
        <label className={clsx('rel gap:0.313rem ml:1.875rem font-weight:460 hidden@media((width<64rem)) app-header-nav', !app.versions.length && 'text-body:hover!')}>
          {app.versions.length
            ? <>
              v{process.env.NEXT_PUBLIC_VERSION}
              <DocVersionSelect />
              <IconChevronDown className="size:1em mr:-0.188rem stroke-width:1.5" />
            </>
            : <>v{process.env.NEXT_PUBLIC_VERSION}</>}
        </label>
        {app.navs.map(({ Icon, fullName, ...eachLink }: any) => <HeaderNav className={clsx('hidden@media((width<64rem))', primaryNavClassName)} key={eachLink.name} {...eachLink}>
          {$(eachLink.name)}
          {eachLink.date && isDateWithinSevenDays(eachLink.date) && <DocBadge className="ml-3xs" $color="primary" $size="xs">New</DocBadge>}
        </HeaderNav>)}
        {app.communityNavs?.map(({ Icon, disabled, fullName, ...eachLink }: any, index: number) => (
          <Link
            {...eachLink}
            aria-label={fullName || eachLink.name}
            className={clsx(index === 0 && 'ml:auto', 'hidden@media((width<64rem)) app-header-icon', { 'text-disabled': disabled })}
            disabled={disabled}
            key={eachLink.name}
          >
            {Icon && <Icon width="22" height="22" strokeWidth="1.2" />}
          </Link>
        ))}
        {app.communityNavs?.length ? <div className='h:1em w:1px mx-md bg-line-base hidden@media((width<64rem))'></div> : null}
        <LanguageButton className="mr:-0.188rem hidden@media((width<64rem)) app-header-icon" />
        <SearchButton id="sidebar-toggle" className="mr:-1.25rem hidden@md app-header-icon">
          <IconListSearch width="22" height="22" strokeWidth="1.2" />
        </SearchButton>
      </HeaderContent>
    </Header>
  )
}
