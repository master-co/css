'use client'

import '~/site/styles/docs-shell/footer.css'
import clsx from 'clsx'
import Link from './Link'
import SearchButton from './SearchButton'
import LanguageSelect from './LanguageSelect'
import ThemeSelect from './ThemeSelect'
import { useThemeMode } from '~/site/docs-shell/contexts/theme-mode'
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
    <div {...props} className={clsx('py-2xl bt-line-subtle border-top-style:solid border-top-width:1px site-footer', className)}>
      <div className='container-type:inline-size max-width:100rem margin-inline:auto'>
        <div data-footer-navigation="" className="font-sm fg-text-muted site-footer-navigation">
          {navGroups.map((group) => (
            <ul className="site-footer-links" key={group.name}>
              <li><h4 className='fg-text-strong'>{$(group.name)}</h4></li>
              {group.links.map((link) => (
                <li key={link.href || link.name}>
                  <Link href={link.href} disabled={link.disabled}>{$(link.name)}</Link>
                </li>
              ))}
            </ul>
          ))}
          <div className="site-footer-search">
            <SearchButton className="display:flex align-items:center width:100% min-height:44px px-md r-lg font-sm bg-surface-base fg-text-muted" />
          </div>
        </div>
      </div>
      <hr className='hr' />
      <div data-footer-legal="" className="max-width:100rem margin-inline:auto font-xs fg-text-muted site-footer-legal">
        <div className="site-footer-copyright">{copyright ?? <>© {new Date().getFullYear()} Aoyue Design LLC.</>}</div>
        {legalLinks.map((link, index) => (
          <Fragment key={link.href || link.name}>
            <Link href={link.href}>{$(link.name)}</Link>
            {index < legalLinks.length - 1 && <div className='bl-line-subtle border-left-style:solid border-left-width:1px'></div>}
          </Fragment>
        ))}
        {legalLinks.length > 0 && <div className='bl-line-subtle border-left-style:solid border-left-width:1px display:none@media((width<64rem))'></div>}
        <label className='position:relative display:none@media((width<64rem))'>
          <span className='pr-xs text-transform:capitalize'>{$('Theme')}: {themeMode.preference && $(themeMode.preference.charAt(0).toUpperCase() + themeMode.preference.slice(1))}</span>
          <ThemeSelect />
          <IconChevronDown className='display:inline-block height:1em width:1em vertical-align:middle' />
        </label>
        <div className='bl-line-subtle border-left-style:solid border-left-width:1px display:none@media((width<64rem))'></div>
        <label className='position:relative display:none@media((width<64rem))'>
          <span className='pr-xs text-transform:capitalize'>{$('Language')}: {localeName}</span>
          <LanguageSelect />
          <IconChevronDown className='display:inline-block height:1em width:1em vertical-align:middle' />
        </label>
      </div>
    </div>
  )
}
