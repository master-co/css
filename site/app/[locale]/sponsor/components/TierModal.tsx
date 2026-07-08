import { Dispatch } from 'react'
import Image from 'next/image'
import Modal from 'internal/components/Modal'
import Link from 'internal/components/Link'
import { useTranslation } from 'internal/contexts/i18n'

export default function TierModal({ tierState }: { tierState: [any, Dispatch<any>] }) {
  const $ = useTranslation()
  const [selectedTier, setSelectedTier] = tierState
  return <Modal backdropClick={() => setSelectedTier(null)} contentClass="max-w:320px pb:0.938rem">
    <div className="flex gap:5x p:1.563rem r:5px flex-col@<lg">
      <div className="font:6xl">{selectedTier.icon}</div>
      <div className='flex:1'>
        <div className="text:md font:medium text:strong uppercase::first-letter">{selectedTier.name}</div>
        {selectedTier.amount && (
          <div className="text:sm font:bold text:strong">
            {selectedTier.amount}
              <span className="ml:0.313rem text:xs font:regular text:body">
              / {selectedTier.one ? $('one-time') : $('month')}
            </span>
          </div>
        )}
      </div>
    </div>
    <div className="mb:0.313rem px:1.563rem pt:0.938rem bt:1px|solid|subtle text:xs">
      {$('Choose a platform')}
    </div>
    <Link href={selectedTier.openCollectiveUrl} className="flex items-center gap:sm min-h:48px px:1.563rem font:medium text-decoration:none!">
      <Image src="/images/open-collective.svg" alt="open-collective" width="24" height="24" />
      {$('Open Collective')}
    </Link>
    <Link href={selectedTier.githubSponsorUrl} className="flex items-center gap:sm min-h:48px px:1.563rem font:medium text-decoration:none!">
      <Image src="/images/github-sponsors.svg" alt="github-sponsors" width="24" height="24" className="transform:scale(1.2)" />
      {$('Github Sponsors')}
    </Link>
  </Modal>
}
