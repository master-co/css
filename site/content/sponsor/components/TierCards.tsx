'use client'

import { useLocale } from '~/site/docs-shell/contexts/locale'
import Link from '~/site/docs-shell/components/Link'

export interface SponsorTier {
  name: string
  icon: string
  amount?: number
  one?: boolean
  openCollectiveUrl: string
  githubSponsorUrl: string
}

/** Presentation labels do not change the identifiers used by the contribution platforms. */
export function tierDisplayName(name: string) {
  return name === 'sliver' ? 'Silver' : name.replace(/^./, letter => letter.toUpperCase())
}

/** Both platforms bill tiers in US dollars, so the amount names its currency. */
export function TierSummary({ tier }: { tier: SponsorTier }) {
  const tw = useLocale() === 'tw'
  return <><span className="sponsor-tier-icon" aria-hidden="true">{tier.icon}</span><span className="sponsor-tier-copy"><strong>{tierDisplayName(tier.name)}</strong><span className="sponsor-tier-amount">{tier.amount !== undefined ? <>{new Intl.NumberFormat(tw ? 'zh-TW' : 'en', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(tier.amount)}<span> / {tier.one ? (tw ? '單次' : 'one-time') : (tw ? '每月' : 'month')}</span></> : <span>{tw ? '自由支持' : 'Your choice'}</span>}</span></span></>
}

export default function TierCards({ tiers, onSelect, label }: { tiers: SponsorTier[], onSelect: (tier: SponsorTier) => void, label: string }) {
  const tw = useLocale() === 'tw'
  return <>
    <div className="sponsor-tier-grid" role="group" aria-label={label}>{tiers.map(tier => <button key={tier.name} type="button" className="sponsor-tier" aria-haspopup="dialog" onClick={event => { event.currentTarget.focus({ preventScroll: true }); onSelect(tier) }}><TierSummary tier={tier} /></button>)}</div>
    <noscript><p>{tw ? '選擇平台以繼續。' : 'Choose a platform to continue.'}</p><ul className="sponsor-static-links">{tiers.map(tier => <li key={tier.name}><div className="sponsor-static-tier"><TierSummary tier={tier} /></div><div className="sponsor-static-platforms"><Link href={tier.openCollectiveUrl}>Open Collective</Link><Link href={tier.githubSponsorUrl}>GitHub Sponsors</Link></div></li>)}</ul></noscript>
  </>
}
