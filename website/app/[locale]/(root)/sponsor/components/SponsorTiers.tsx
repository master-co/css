'use client'

import { useState } from 'react'
import { getSponsorTiers } from 'websites/utils/get-sponsor-tiers'
import TierModal from './TierModal'
import useRewritedPathname from 'websites/uses/rewrited-pathname'

export default function SponsorTiers() {
    const pathname = useRewritedPathname()
    const [selectedTier, setSelectedTier] = useState<any>()
    const sponsorTiers = getSponsorTiers(pathname)

    return <div className="gap:15 grid-cols:2 grid-cols:4@sm">
        {sponsorTiers.map((eachSponsorTier) => (
            <button key={eachSponsorTier.name} className="app-object app-object-interactive flex:col@<lg gap:20 p:25|30 r:5" onClick={() => setSelectedTier(eachSponsorTier)}>
                <div className="font:48">{eachSponsorTier.icon}</div>
                <div className='flex:1'>
                    <div className="text:16 uppercase::first-letter font:semibold">{eachSponsorTier.name}</div>
                    {eachSponsorTier.amount && (
                        <div className="text:14 font:bold">
                            {eachSponsorTier.amount}
                            <span className="text:12 fg:neutral font:regular ml:5">
                                / {eachSponsorTier.one ? 'one-time' : 'month'}
                            </span>
                        </div>
                    )}
                </div>
            </button>
        ))}
        {selectedTier && <TierModal tierState={[selectedTier, setSelectedTier]} />}
    </div>
}