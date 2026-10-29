'use client'

import { useState } from 'react'
import TierModal from './TierModal'
import { usePathname } from '~/site/docs-shell/layouts/root'
import TierCards, { type SponsorTier } from './TierCards'

export default function BackerTiers() {
  const pathname = usePathname()
  const [selectedTier, setSelectedTier] = useState<any>()
  const openCollectiveRedirectUrl = 'https://docs.master.co' + pathname?.replace('donate', 'sponsor')
  const backerTiers: SponsorTier[] = [
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

  return <>
    <TierCards tiers={backerTiers} onSelect={setSelectedTier} label="Backer tiers" />
    {
      selectedTier && <TierModal tierState={[selectedTier, setSelectedTier]} />
    }
  </>
}
