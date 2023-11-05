import Demo from 'shared/components/Demo'
import DemoPanel from 'shared/components/DemoPanel'
import Image from 'next/image'
import { l } from 'to-line'
import { IconRefresh, IconRotateClockwise } from '@tabler/icons-react'
import Code from 'shared/components/Code'

export default ({ className }: any) => {
    return (
        <>
            <Demo>
                <IconRotateClockwise className="stroke:.5 stroke:dim 48x48" strokeDasharray={1.5} />
                <IconRotateClockwise className={l(className, 'app-icon-primary stroke:.5 48x48')} />
            </Demo>
            <Code lang="html">{`
                <svg class="**${className}**">…</svg>
            `}</Code>
        </>
    )
}