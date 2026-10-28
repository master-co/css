'use client'

import './footer.css'
import { IconChevronDown } from '@tabler/icons-react'
import CSSLogotype from '~/site/docs-shell/components/CSSLogotype'
import LanguageSelect from '~/site/docs-shell/components/LanguageSelect'
import Link from '~/site/docs-shell/components/Link'
import ThemeSelect from '~/site/docs-shell/components/ThemeSelect'
import { useI18n, useTranslation } from '~/site/docs-shell/contexts/i18n'
import { useLocale } from '~/site/docs-shell/contexts/locale'
import { useThemeMode } from '~/site/docs-shell/contexts/theme-mode'
import { communityNavs, footerLegalLinks, footerNavGroups } from '~/site/navigation'

/**
 * The homepage's closing footer, drawn like a spec sheet: the drafting rails and rulers carry
 * on from the sections, the brand and link groups sit in hairline cells, a quiet base line holds the
 * license and preferences, and a hatched wordmark rests on the bottom edge.
 */
export default function HomeFooter() {
  const $ = useTranslation()
  const themeMode = useThemeMode()
  const locale = useLocale()
  const i18n = useI18n()
  // The preference is read on the client; the server and the first paint show the default.
  const preference = themeMode.preference ?? 'system'
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
            <p className="home-footer-tagline">{$('A markup-driven CSS orchestration language for developers and AI agents.')}</p>
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
            {groups.map((group, index) => (
              <div className="home-footer-group" key={group.name}>
                <h2 className="home-footer-heading">
                  <span className="home-footer-index">{String(index + 1).padStart(2, '0')}</span>
                  {$(group.name)}
                </h2>
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
          <span className="home-footer-copyright">© {new Date().getFullYear()} Aoyue Design LLC.</span>
          {footerLegalLinks.map((link) => (
            <Link className="home-footer-link" href={link.href} key={link.href}>{$(link.name)}</Link>
          ))}
          <span className="home-footer-preferences">
            <label className="home-footer-select">
              <span>{$('Theme')}: {$(preference.charAt(0).toUpperCase() + preference.slice(1))}</span>
              <IconChevronDown aria-hidden="true" size={13} stroke={1.75} />
              <ThemeSelect />
            </label>
            <label className="home-footer-select">
              <span>{i18n.nameOfLocale[locale] ?? locale}</span>
              <IconChevronDown aria-hidden="true" size={13} stroke={1.75} />
              <LanguageSelect />
            </label>
          </span>
        </div>
      </div>
      <p aria-hidden="true" className="home-footer-mark">master css</p>
    </footer>
  )
}
