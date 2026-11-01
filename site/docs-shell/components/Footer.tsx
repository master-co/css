'use client'

import '~/site/styles/docs-shell/footer.css'
import clsx from 'clsx'
import Link from './Link'
import LanguageSelect from './LanguageSelect'
import ThemeSelect from './ThemeSelect'
import { useThemeMode } from '~/site/docs-shell/contexts/theme-mode'
import { IconChevronDown } from '@tabler/icons-react'
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

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  navGroups?: FooterNavGroup[]
  legalLinks?: (FooterLink & { href: string })[]
  copyright?: ReactNode
}

/** The site footer: link groups, then the legal row: the notice and its links, and the theme and language preferences. */
export default function Footer({ navGroups = [], legalLinks = [], copyright, className, ...props }: FooterProps) {
  const themeMode = useThemeMode()
  const locale = useLocale()
  const i18n = useI18n()
  const $ = useTranslation()
  const localeName = i18n.nameOfLocale[locale] ?? locale
  return (
    <footer {...props} className={clsx('ui-footer', className)}>
      <nav aria-label={$('Footer')} className="ui-footer-nav">
        {navGroups.map((group) => (
          <div className="ui-footer-group" key={group.name}>
            <h2>{$(group.name)}</h2>
            <ul>
              {group.links.map((link) => (
                <li key={link.href || link.name}>
                  <Link href={link.href} disabled={link.disabled}>{$(link.name)}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="ui-footer-legal">
        <p className="ui-footer-notice">
          <span>{copyright ?? <>© {new Date().getFullYear()} Aoyue Design LLC.</>}</span>
          {legalLinks.map((link) => <Link key={link.href || link.name} href={link.href}>{$(link.name)}</Link>)}
        </p>
        <label className="ui-footer-preference">
          {$('Theme')}: {themeMode.preference && $(themeMode.preference.charAt(0).toUpperCase() + themeMode.preference.slice(1))}
          <ThemeSelect />
          <IconChevronDown aria-hidden="true" stroke={1.5} />
        </label>
        <label className="ui-footer-preference">
          {$('Language')}: {localeName}
          <LanguageSelect />
          <IconChevronDown aria-hidden="true" stroke={1.5} />
        </label>
      </div>
    </footer>
  )
}
