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
                <div className="font:48px">{eachSponsorTier.icon}</div>
                <div className='flex:1 text-left'>
                    <div className="text:16px fg:strong font:medium uppercase::first-letter">{eachSponsorTier.name}</div>
                    {eachSponsorTier.amount && (
                        <div className="text:14px font:bold">
                            {eachSponsorTier.amount}
                            <span className="text:12px fg:text font:regular ml:0.313rem">
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
