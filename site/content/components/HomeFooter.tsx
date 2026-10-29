'use client'

import './footer.css'
import { IconChevronDown, IconDeviceDesktop, IconLanguage, IconMoon, IconSun } from '@tabler/icons-react'
import CSSLogotype from '~/site/docs-shell/components/CSSLogotype'
import LanguageSelect from '~/site/docs-shell/components/LanguageSelect'
import Link from '~/site/docs-shell/components/Link'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import { useI18n, useTranslation } from '~/site/docs-shell/contexts/i18n'
import { useLocale } from '~/site/docs-shell/contexts/locale'
import { useThemeMode } from '~/site/docs-shell/contexts/theme-mode'
import { communityNavs, footerLegalLinks, footerNavGroups } from '~/site/navigation'

/** An open closing colophon, aligned to the page's drafting rails. */
export default function HomeFooter() {
  const $ = useTranslation()
  const themeMode = useThemeMode()
  const locale = useLocale()
  const i18n = useI18n()
  // The preference is read on the client; the server and the first paint show the default.
  const preference = themeMode.preference ?? 'system'
  const ThemeIcon = preference === 'light' ? IconSun : preference === 'dark' ? IconMoon : IconDeviceDesktop
  const groups = footerNavGroups.filter((group) => group.name !== 'Community')
  return (
    <footer className="home-footer">
      <div aria-hidden="true" className="home-footer-drafting" />
      <div className="app-wrapper home-footer-wrap">
        <div className="home-footer-sheet">
          <div className="home-footer-brand">
            <Link aria-label="Master CSS" className="home-footer-logo" href="/">
              <CSSLogotype height={26} width={217} />
            </Link>
            <ul className="home-footer-social">
              {communityNavs.map(({ Icon, href, name }) => (
                <li key={name}>
                  <Link aria-label={name} className="home-footer-icon" href={href}>
                    <Icon aria-hidden="true" size={17} stroke={1.5} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <nav aria-label={$('Footer')} className="home-footer-nav">
            {groups.map((group) => (
              <div className="home-footer-group" key={group.name}>
                <h2 className="home-footer-heading">{$(group.name)}</h2>
                <ul className="home-footer-links">
                  {group.links.filter((link) => !footerLegalLinks.some((legal) => legal.href === link.href)).map((link) => (
                    <li key={link.href}>
                      <Link className="home-footer-link" href={link.href}>{$(link.name)}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="home-footer-base">
          <div className="home-footer-meta">
            <span className="home-footer-copyright">© {new Date().getFullYear()} Aoyue Design LLC.</span>
            <div className="home-footer-legal">
              {footerLegalLinks.map((link) => (
                <Link className="home-footer-link" href={link.href} key={link.href}>{$(link.name)}</Link>
              ))}
            </div>
          </div>
          <div className="home-footer-preferences">
            <label className="home-footer-select">
              <ThemeIcon aria-hidden="true" size={15} stroke={1.5} />
              <span>{$(preference.charAt(0).toUpperCase() + preference.slice(1))}</span>
              <IconChevronDown aria-hidden="true" size={13} stroke={1.75} />
              <ThemeSelect aria-label={$('Theme')} />
            </label>
            <label className="home-footer-select">
              <IconLanguage aria-hidden="true" size={15} stroke={1.5} />
              <span>{i18n.nameOfLocale[locale] ?? locale}</span>
              <IconChevronDown aria-hidden="true" size={13} stroke={1.75} />
              <LanguageSelect aria-label={$('Language')} />
            </label>
          </div>
        </div>
        <p aria-hidden="true" className="home-footer-mark">master css</p>
      </div>
    </footer>
  )
}
