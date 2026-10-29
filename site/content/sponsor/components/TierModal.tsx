import { Dispatch } from 'react'
import Image from '~/site/docs-shell/components/Image'
import Modal from '~/site/docs-shell/components/Modal'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { TierSummary } from './TierCards'

export default function TierModal({ tierState }: { tierState: [any, Dispatch<any>] }) {
  const $ = useTranslation()
  const [selectedTier, setSelectedTier] = tierState
  return <Modal label={$('Choose a platform')} backdropClick={() => setSelectedTier(null)} contentClass="max-width:320px padding-bottom:0.938rem">
    <div className="sponsor-tier-modal-summary"><TierSummary tier={selectedTier} /></div>
    <div className="margin-bottom:0.313rem padding-inline:1.563rem padding-top:0.938rem bt-line-subtle border-top-style:solid border-top-width:1px text-xs">
      {$('Choose a platform')}
    </div>
    <Link href={selectedTier.openCollectiveUrl} className="display:flex align-items:center gap-sm min-height:48px padding-inline:1.563rem font-medium text-decoration:none!">
      <Image src="/images/open-collective.svg" alt="" width="24" height="24" />
      {$('Open Collective')}
    </Link>
    <Link href={selectedTier.githubSponsorUrl} className="display:flex align-items:center gap-sm min-height:48px padding-inline:1.563rem font-medium text-decoration:none!">
      <Image src="/images/github-sponsors.svg" alt="" width="24" height="24" className="transform:scale(1.2)" />
      {$('GitHub Sponsors')}
    </Link>
  </Modal>
}
