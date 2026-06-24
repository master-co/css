'use client'

import { useState } from 'react'
import { getSponsorTiers } from 'internal/utils/get-sponsor-tiers'
import TierModal from './TierModal'
import useRewritedPathname from 'internal/uses/rewrited-pathname'

export default function SponsorTiers() {
    const pathname = useRewritedPathname()
    const [selectedTier, setSelectedTier] = useState<any>()
    const sponsorTiers = getSponsorTiers(pathname || '')

    return <div className="gap:0.938rem grid-cols:2 grid-cols:3@sm">
        {sponsorTiers.map((eachSponsorTier) => (
            <button key={eachSponsorTier.name} className="app-object app-object-interactive gap:5x p:1.563rem|1.875rem r:5px flex-col@<lg" onClick={() => setSelectedTier(eachSponsorTier)}>
                <div className="font:6xl">{eachSponsorTier.icon}</div>
                <div className='text-left flex:1'>
                    <div className="text:md font:medium text:strong uppercase::first-letter">{eachSponsorTier.name}</div>
                    {eachSponsorTier.amount && (
                        <div className="text:sm font:bold">
                            {eachSponsorTier.amount}
                            <span className="text:xs fg:text font:regular ml:0.313rem">
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
