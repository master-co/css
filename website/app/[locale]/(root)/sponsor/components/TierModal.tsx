import { Dispatch } from 'react'
import Image from 'next/image'
import Modal from 'websites/components/Modal'
import { cls } from 'websites/utils/cls'
import Link from 'websites/components/Link'

const LIST_NAV_CLASS = cls`
    text-decoration:none! flex align-items:center px:20 min-h:48 gap:12 font:medium
    bg:slate-90:hover@light bg:gray-26:hover@dark
`

export default function TierModal({ tierState }: { tierState: [any, Dispatch<any>] }) {
    const [selectedTier, setSelectedTier] = tierState
    return <Modal backdropClick={() => setSelectedTier(null)} contentClass="max-w:320 pb:15">
        <div className="flex flex:col@<lg p:25 gap:20 r:5">
            <div className="font:48">{selectedTier.icon}</div>
            <div className='flex:1'>
                <div className="text:16 fg:major font:semibold uppercase::first-letter">{selectedTier.name}</div>
                {selectedTier.amount && (
                    <div className="fg:major text:14 font:bold">
                        {selectedTier.amount}
                        <span className="text:12 fg:neutral font:regular ml:5">
                            / {selectedTier.one ? 'one-time' : 'month'}
                        </span>
                    </div>
                )}
            </div>
        </div>
        <div className="text:12 mb:5 px:25 bt:1|solid|divider pt:15">
            Choose a platform
        </div>
        <Link href={selectedTier.openCollectiveUrl} className={`${LIST_NAV_CLASS} px:25!`}>
            <Image src="/images/open-collective.svg" alt="open-collective" width="24" height="24" />
            Open Collective
        </Link>
        <Link href={selectedTier.githubSponsorUrl} className={`${LIST_NAV_CLASS} px:25!`}>
            <Image src="/images/github-sponsors.svg" alt="github-sponsors" width="24" height="24" className="scale(1.2)" />
            Github Sponsors
        </Link>
    </Modal>
}