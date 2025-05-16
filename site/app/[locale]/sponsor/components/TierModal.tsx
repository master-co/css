import { Dispatch } from 'react'
import Image from 'next/image'
import Modal from 'internal/components/Modal'
import Link from 'internal/components/Link'

export default function TierModal({ tierState }: { tierState: [any, Dispatch<any>] }) {
    const [selectedTier, setSelectedTier] = tierState
    return <Modal backdropClick={() => setSelectedTier(null)} contentClass="max-w:320 pb:15">
        <div className="flex gap:20 p:25 r:5 flex-col@<lg">
            <div className="font:48">{selectedTier.icon}</div>
            <div className='flex:1'>
                <div className="text:16 fg:strong font:medium uppercase::first-letter">{selectedTier.name}</div>
                {selectedTier.amount && (
                    <div className="text:14 fg:strong font:bold">
                        {selectedTier.amount}
                        <span className="text:12 fg:neutral font:regular ml:5">
                            / {selectedTier.one ? 'one-time' : 'month'}
                        </span>
                    </div>
                )}
            </div>
        </div>
        <div className="bt:1|solid|lightest px:25 text:12 mb:5 pt:15">
            Choose a platform
        </div>
        <Link href={selectedTier.openCollectiveUrl} className="flex gap:12 text-decoration:none! px:25 align-items:center font:medium min-h:48">
            <Image src="/images/open-collective.svg" alt="open-collective" width="24" height="24" />
            Open Collective
        </Link>
        <Link href={selectedTier.githubSponsorUrl} className="flex gap:12 text-decoration:none! px:25 align-items:center font:medium min-h:48">
            <Image src="/images/github-sponsors.svg" alt="github-sponsors" width="24" height="24" className="scale(1.2)" />
            Github Sponsors
        </Link>
    </Modal>
}