'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { getSponsorTiers } from 'websites-shared/utils/get-sponsor-tiers'
import TierModal from './TierModal'

export default function SponsorTiers() {
    const pathname = usePathname()
    const [selectedTier, setSelectedTier] = useState<any>()
    const sponsorTiers = getSponsorTiers(pathname)

    return <div className="grid-cols:2 grid-cols:4@sm gap:15">
        {sponsorTiers.map((eachSponsorTier) => (
            <button key={eachSponsorTier.name} className="app-object app-object-interactive flex:col@<lg p:25|30 gap:20 r:5" onClick={() => setSelectedTier(eachSponsorTier)}>
                <div className="font:48">{eachSponsorTier.icon}</div>
                <div className='flex:1'>
                    <div className="text:16 font:semibold uppercase::first-letter">{eachSponsorTier.name}</div>
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