'use client'

import { useState } from 'react'
import TierModal from './TierModal'
import useRewritedPathname from 'internal/uses/rewrited-pathname'

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

    return <div className="gap:0.938rem grid-cols:2 grid-cols:3@sm">
        {backerTiers.map((eachBackerTier) => (
            <button key={eachBackerTier.name} className="app-object app-object-interactive gap:5x p:1.563rem|1.875rem r:5px flex-col@<lg" onClick={() => setSelectedTier(eachBackerTier)}>
                <div className="font:48px">{eachBackerTier.icon}</div>
                <div className='flex:1 text-left'>
                    <div className="text:16px text:strong font:medium uppercase::first-letter">{eachBackerTier.name}</div>
                    {eachBackerTier.amount && (
                        <div className="text:14px font:bold">
                            {eachBackerTier.amount}
                            <span className="text:12px fg:text font:regular ml:0.313rem">
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
