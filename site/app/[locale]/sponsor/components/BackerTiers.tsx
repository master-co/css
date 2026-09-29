'use client'

import { useState } from 'react'
import TierModal from './TierModal'
import useRewritedPathname from '~/site/docs-shell/uses/rewrited-pathname'

export default function BackerTiers() {
  const pathname = useRewritedPathname()
  const [selectedTier, setSelectedTier] = useState<any>()
  const openCollectiveRedirectUrl = 'https://docs.master.co' + pathname?.replace('donate', 'sponsor')
  const backerTiers: {
    name: string
    description?: string
    icon: string
    amount?: number
    openCollectiveUrl: string
    githubSponsorUrl: string
    one?: boolean
  }[] = [
      {
        name: 'say yeah',
        icon: '✌🏻',
        amount: 2,
        openCollectiveUrl: 'https://opencollective.com/master-co/contribute/say-yeah-38282?redirect=' + openCollectiveRedirectUrl,
        githubSponsorUrl: 'https://github.com/sponsors/master-co/sponsorships?tier_id=117592&preview=false',
      },
      {
        name: 'give me five',
        icon: '🖐🏻',
        amount: 5,
        openCollectiveUrl: 'https://opencollective.com/master-co/contribute/give-me-five-38283?redirect=' + openCollectiveRedirectUrl,
        githubSponsorUrl: 'https://github.com/sponsors/master-co/sponsorships?tier_id=117593&preview=false',
      },
      {
        name: 'clap',
        icon: '👏🏻',
        amount: 10,
        openCollectiveUrl: 'https://opencollective.com/master-co/contribute/clap-38289?redirect=' + openCollectiveRedirectUrl,
        githubSponsorUrl: 'https://github.com/sponsors/master-co/sponsorships?tier_id=117594&preview=false',
      },
      {
        name: 'freely',
        icon: '✍🏻',
        openCollectiveUrl: 'https://opencollective.com/master-co/donate?redirect=' + openCollectiveRedirectUrl,
        githubSponsorUrl: 'https://github.com/sponsors/master-co/sponsorships?preview=false&frequency=one-time&amount=3',
      }
    ]

  return <div className="grid-cols(2) gap:0.938rem grid-cols(3)@sm">
    {backerTiers.map((eachBackerTier) => (
      <button key={eachBackerTier.name} className="gap:1.25rem padding-top:1.563rem padding-right:1.875rem padding-bottom:1.563rem padding-left:1.875rem border-radius:5px flex-direction:column@media((width<80rem)) app-object app-object-interactive" onClick={() => setSelectedTier(eachBackerTier)}>
        <div className="font-size-6xl">{eachBackerTier.icon}</div>
        <div className='flex:1 text-align:left'>
          <div className="text-md font-weight-medium fg-text-strong text-transform:uppercase::first-letter">{eachBackerTier.name}</div>
          {eachBackerTier.amount && (
            <div className="text-sm font-weight-bold">
              {eachBackerTier.amount}
              <span className="margin-left:0.313rem text-xs font-weight-regular fg-text-body">
                / {eachBackerTier.one ? 'one-time' : 'month'}
              </span>
            </div>
          )}
        </div>
      </button>
    ))}
    {
      selectedTier && <TierModal tierState={[selectedTier, setSelectedTier]} />
    }
  </div>
}
