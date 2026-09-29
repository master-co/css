'use client'

import { useState } from 'react'
import { getSponsorTiers } from '~/site/docs-shell/utils/get-sponsor-tiers'
import TierModal from './TierModal'
import useRewritedPathname from '~/site/docs-shell/uses/rewrited-pathname'

export default function SponsorTiers() {
  const pathname = useRewritedPathname()
  const [selectedTier, setSelectedTier] = useState<any>()
  const sponsorTiers = getSponsorTiers(pathname || '')

  return <div className="grid-cols(2) gap:0.938rem grid-cols(3)@sm">
    {sponsorTiers.map((eachSponsorTier) => (
      <button key={eachSponsorTier.name} className="gap:1.25rem padding:1.563rem|1.875rem border-radius:5px flex-direction:column@media((width<80rem)) app-object app-object-interactive" onClick={() => setSelectedTier(eachSponsorTier)}>
        <div className="font-6xl">{eachSponsorTier.icon}</div>
        <div className='flex:1 text-align:left'>
          <div className="text-md font-medium fg-text-strong text-transform:uppercase::first-letter">{eachSponsorTier.name}</div>
          {eachSponsorTier.amount && (
            <div className="text-sm font-bold">
              {eachSponsorTier.amount}
              <span className="margin-left:0.313rem text-xs font-regular fg-text-body">
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
