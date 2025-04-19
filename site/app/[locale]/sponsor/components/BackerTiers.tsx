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

    return <div className="gap:15 grid-cols:2 grid-cols:3@sm">
        {backerTiers.map((eachBackerTier) => (
            <button key={eachBackerTier.name} className="app-object app-object-interactive gap:20 p:25|30 r:5 flex:col@<lg" onClick={() => setSelectedTier(eachBackerTier)}>
                <div className="font:48">{eachBackerTier.icon}</div>
                <div className='flex:1 text:left'>
                    <div className="text:16 fg:strong font:medium uppercase::first-letter">{eachBackerTier.name}</div>
                    {eachBackerTier.amount && (
                        <div className="text:14 font:bold">
                            {eachBackerTier.amount}
                            <span className="text:12 fg:neutral font:regular ml:5">
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