import { Dispatch } from 'react'
import Image from 'next/image'
import Modal from '~/site/docs-shell/components/Modal'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'

export default function TierModal({ tierState }: { tierState: [any, Dispatch<any>] }) {
  const $ = useTranslation()
  const [selectedTier, setSelectedTier] = tierState
  return <Modal backdropClick={() => setSelectedTier(null)} contentClass="max-width:320px padding-bottom:0.938rem">
    <div className="display:flex gap:1.25rem padding:1.563rem border-radius:5px flex-direction:column@media((width<80rem))">
      <div className="font-size-6xl">{selectedTier.icon}</div>
      <div className='flex:1'>
        <div className="text-md font-weight-medium fg-text-strong text-transform:uppercase::first-letter">{selectedTier.name}</div>
        {selectedTier.amount && (
          <div className="text-sm font-weight-bold fg-text-strong">
            {selectedTier.amount}
              <span className="margin-left:0.313rem text-xs font-weight-regular fg-text-body">
              / {selectedTier.one ? $('one-time') : $('month')}
            </span>
          </div>
        )}
      </div>
    </div>
    <div className="margin-bottom:0.313rem padding-inline:1.563rem padding-top:0.938rem border-top-width:1px border-top-style:solid bt-line-subtle text-xs">
      {$('Choose a platform')}
    </div>
    <Link href={selectedTier.openCollectiveUrl} className="display:flex align-items:center gap-sm min-height:48px padding-inline:1.563rem font-weight-medium text-decoration:none!">
      <Image src="/images/open-collective.svg" alt="open-collective" width="24" height="24" />
      {$('Open Collective')}
    </Link>
    <Link href={selectedTier.githubSponsorUrl} className="display:flex align-items:center gap-sm min-height:48px padding-inline:1.563rem font-weight-medium text-decoration:none!">
      <Image src="/images/github-sponsors.svg" alt="github-sponsors" width="24" height="24" className="transform:scale(1.2)" />
      {$('Github Sponsors')}
    </Link>
  </Modal>
}
