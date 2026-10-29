'use client'

import { useState } from 'react'
import { getSponsorTiers } from '~/site/docs-shell/utils/get-sponsor-tiers'
import TierModal from './TierModal'
import { usePathname } from '~/site/docs-shell/layouts/root'
import TierCards from './TierCards'

export default function SponsorTiers() {
  const pathname = usePathname()
  const [selectedTier, setSelectedTier] = useState<any>()
  const sponsorTiers = getSponsorTiers(pathname || '')

  return <>
    <TierCards tiers={sponsorTiers} onSelect={setSelectedTier} label="Sponsor tiers" />
    {selectedTier && <TierModal tierState={[selectedTier, setSelectedTier]} />}
  </>
}
