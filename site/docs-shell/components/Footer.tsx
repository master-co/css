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
    <div {...props} className={clsx('py:2xl bt:1px|solid|muted', className)}>
      <div className='container max-w:breakpoint-2xl mx:auto'>
        <div className="grid-cols:2 flex:1 justify-between gap:10x font:sm text:muted grid-cols:4@container(2xs) grid-cols:5@container(md)">
          {navGroups.map((group) => (
            <ul className='flex flex-col gap:lg' key={group.name}>
              <li><h4 className='text:strong'>{$(group.name)}</h4></li>
              {group.links.map((link) => (
                <li key={link.href || link.name}>
                  <Link href={link.href} disabled={link.disabled}>{$(link.name)}</Link>
                </li>
              ))}
            </ul>
          ))}
          <div className='hidden@container(<md)'>
            <SearchButton className="flex items-center h:36px w:full px:md r:lg font:sm bg:surface-base text:disabled" />
          </div>
        </div>
      </div>
      <hr className='hr' />
      <div className="flex gap:md max-w:breakpoint-2xl mx:auto font:xs text:muted">
        {copyright ?? <>© {new Date().getFullYear()} Aoyue Design LLC.</>}
        {legalLinks.map((link, index) => (
          <Fragment key={link.href || link.name}>
            <Link href={link.href} className={clsx(index === 0 && 'ml:auto')}>{$(link.name)}</Link>
            {index < legalLinks.length - 1 && <div className='bl:1px|solid|muted'></div>}
          </Fragment>
        ))}
        {legalLinks.length > 0 && <div className='bl:1px|solid|muted hidden@<md'></div>}
        <label className='rel hidden@<md'>
          <span className='pr:xs capitalize'>{$('Theme')}: {$(themeMode.preference?.charAt(0).toUpperCase() + themeMode.preference?.slice(1))}</span>
          <ThemeSelect />
          <IconChevronDown className='inline-block size:1em vertical-align:middle' />
        </label>
        <div className='bl:1px|solid|muted hidden@<md'></div>
        <label className='rel hidden@<md'>
          <span className='pr:xs capitalize'>{$('Language')}: {localeName}</span>
          <LanguageSelect />
          <IconChevronDown className='inline-block size:1em vertical-align:middle' />
        </label>
      </div>
    </div>
  )
}
