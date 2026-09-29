'use client'

import clsx from 'clsx'
import Link from './Link'
import SearchButton from './SearchButton'
import LanguageSelect from './LanguageSelect'
import ThemeSelect from './ThemeSelect'
import { useThemeMode } from '@master/theme-mode.react'
import { IconChevronDown } from '@tabler/icons-react'
import { Fragment } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { useI18n, useTranslation } from '../contexts/i18n'
import { useLocale } from '../contexts/locale'

export interface FooterLink {
  name: string
  href?: string
  disabled?: boolean
}

export interface FooterNavGroup {
  name: string
  links: FooterLink[]
}

export interface FooterProps extends HTMLAttributes<HTMLDivElement> {
  navGroups?: FooterNavGroup[]
  legalLinks?: (FooterLink & { href: string })[]
  copyright?: ReactNode
}

export default function Footer({ navGroups = [], legalLinks = [], copyright, className, ...props }: FooterProps) {
  const themeMode = useThemeMode()
  const locale = useLocale()
  const i18n = useI18n()
  const $ = useTranslation()
  const localeName = i18n.nameOfLocale[locale] ?? locale
  return (
    <div {...props} className={clsx('py-2xl border-top-width:1px border-top-style:solid bt-line-subtle', className)}>
      <div className='container-type:inline-size max-width:100rem margin-inline:auto'>
        <div className="grid-cols(2) flex:1 justify-content:space-between gap:2.5rem font-sm fg-text-muted grid-cols(4)@container((width>=18rem)) grid-cols(5)@container((width>=28rem))">
          {navGroups.map((group) => (
            <ul className='display:flex flex-direction:column gap-lg' key={group.name}>
              <li><h4 className='fg-text-strong'>{$(group.name)}</h4></li>
              {group.links.map((link) => (
                <li key={link.href || link.name}>
                  <Link href={link.href} disabled={link.disabled}>{$(link.name)}</Link>
                </li>
              ))}
            </ul>
          ))}
          <div className='display:none@container((width<28rem))'>
            <SearchButton className="display:flex align-items:center height:36px width:100% px-md r-lg font-sm bg-surface-base fg-text-muted" />
          </div>
        </div>
      </div>
      <hr className='hr' />
      <div className="display:flex gap-md max-width:100rem margin-inline:auto font-xs fg-text-muted">
        {copyright ?? <>© {new Date().getFullYear()} Aoyue Design LLC.</>}
        {legalLinks.map((link, index) => (
          <Fragment key={link.href || link.name}>
            <Link href={link.href} className={clsx(index === 0 && 'margin-left:auto')}>{$(link.name)}</Link>
            {index < legalLinks.length - 1 && <div className='border-left-width:1px border-left-style:solid bl-line-subtle'></div>}
          </Fragment>
        ))}
        {legalLinks.length > 0 && <div className='border-left-width:1px border-left-style:solid bl-line-subtle display:none@media((width<64rem))'></div>}
        <label className='position:relative display:none@media((width<64rem))'>
          <span className='pr-xs text-transform:capitalize'>{$('Theme')}: {$(themeMode.preference?.charAt(0).toUpperCase() + themeMode.preference?.slice(1))}</span>
          <ThemeSelect />
          <IconChevronDown className='display:inline-block height:1em width:1em vertical-align:middle' />
        </label>
        <div className='border-left-width:1px border-left-style:solid bl-line-subtle display:none@media((width<64rem))'></div>
        <label className='position:relative display:none@media((width<64rem))'>
          <span className='pr-xs text-transform:capitalize'>{$('Language')}: {localeName}</span>
          <LanguageSelect />
          <IconChevronDown className='display:inline-block height:1em width:1em vertical-align:middle' />
        </label>
      </div>
    </div>
  )
}
