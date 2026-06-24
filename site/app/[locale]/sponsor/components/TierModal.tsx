import { Dispatch } from 'react'
import Image from 'next/image'
import Modal from 'internal/components/Modal'
import Link from 'internal/components/Link'

export default function TierModal({ tierState }: { tierState: [any, Dispatch<any>] }) {
    const [selectedTier, setSelectedTier] = tierState
    return <Modal backdropClick={() => setSelectedTier(null)} contentClass="max-w:320px pb:0.938rem">
        <div className="flex gap:5x p:1.563rem r:5px flex-col@<lg">
            <div className="font:48px">{selectedTier.icon}</div>
            <div className='flex:1'>
                <div className="text:16px text:strong font:medium uppercase::first-letter">{selectedTier.name}</div>
                {selectedTier.amount && (
                    <div className="text:14px text:strong font:bold">
                        {selectedTier.amount}
                            <span className="text:12px fg:text font:regular ml:0.313rem">
                            / {selectedTier.one ? 'one-time' : 'month'}
                        </span>
                    </div>
                )}
            </div>
        </div>
        <div className="bt:1px|solid|subtle px:1.563rem text:12px mb:0.313rem pt:0.938rem">
            Choose a platform
        </div>
        <Link href={selectedTier.openCollectiveUrl} className="flex gap:3x text-decoration:none! px:1.563rem align-items:center font:medium min-h:48px">
            <Image src="/images/open-collective.svg" alt="open-collective" width="24" height="24" />
            Open Collective
        </Link>
        <Link href={selectedTier.githubSponsorUrl} className="flex gap:3x text-decoration:none! px:1.563rem align-items:center font:medium min-h:48px">
            <Image src="/images/github-sponsors.svg" alt="github-sponsors" width="24" height="24" className="transform:scale(1.2)" />
            Github Sponsors
        </Link>
    </Modal>
}
