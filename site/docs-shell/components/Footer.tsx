'use client'

import '~/site/styles/docs-shell/footer.css'
import clsx from 'clsx'
import Link from './Link'
import LanguageSelect from './LanguageSelect'
import ThemeSelect from './ThemeSelect'
import { useThemeMode } from '~/site/docs-shell/contexts/theme-mode'
import { IconChevronDown, IconDeviceDesktop, IconLanguage, IconMoon, IconSun } from '@tabler/icons-react'
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
  copyright?: ReactNode
}

/** The site footer: link groups (legal links among them), then one quiet row: the notice, and the theme and language
 * preferences shown by an icon and their value alone (the selects carry their names). */
export default function Footer({ navGroups = [], copyright, className, ...props }: FooterProps) {
  const themeMode = useThemeMode()
  const locale = useLocale()
  const i18n = useI18n()
  const $ = useTranslation()
  const localeName = i18n.nameOfLocale[locale] ?? locale
  // The preference is read on the client; the server and the first paint show the default.
  const preference = themeMode.preference ?? 'system'
  const ThemeIcon = preference === 'light' ? IconSun : preference === 'dark' ? IconMoon : IconDeviceDesktop
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
        <p className="ui-footer-notice">{copyright ?? <>© {new Date().getFullYear()} Aoyue Design LLC.</>}</p>
        <label className="ui-footer-preference">
          <ThemeIcon aria-hidden="true" stroke={1.5} />
          {$(preference.charAt(0).toUpperCase() + preference.slice(1))}
          <ThemeSelect aria-label={$('Theme')} />
          <IconChevronDown aria-hidden="true" stroke={1.5} />
        </label>
        <label className="ui-footer-preference">
          <IconLanguage aria-hidden="true" stroke={1.5} />
          {localeName}
          <LanguageSelect aria-label={$('Language')} />
          <IconChevronDown aria-hidden="true" stroke={1.5} />
        </label>
      </div>
    </footer>
  )
}
