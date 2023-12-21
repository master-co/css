import Demo from 'websites/components/Demo'
import DemoPanel from 'websites/components/DemoPanel'
import Image from 'next/image'
import { l } from 'to-line'
import { IconRefresh, IconRotateClockwise } from '@tabler/icons-react'
import Code from 'websites/components/Code'

export default ({ className }: any) => {
    return (
        <>
            <Demo>
                <IconRotateClockwise className="size:12x stroke:.5 stroke:dim" strokeDasharray={1.5} />
                <IconRotateClockwise className={l(className, 'app-icon-primary stroke:.5 size:12x')} />
            </Demo>
            <Code lang="html">{`
                <svg class="**${className}**">…</svg>
            `}</Code>
        </>
    )
}