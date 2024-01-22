import Demo from 'websites/components/Demo'
import DemoPanel from 'websites/components/DemoPanel'
import Image from 'next/image'
import clsx from 'clsx'
import { IconRefresh, IconRotateClockwise } from '@tabler/icons-react'
import Code from 'websites/components/Code'

export default ({ className }: any) => {
    return (
        <>
            <Demo>
                <IconRotateClockwise className="size:12x stroke:.5 stroke:text-lightest" strokeDasharray={1.5} />
                <IconRotateClockwise className={clsx(className, 'app-icon-primary size:12x stroke:.5')} />
            </Demo>
            <Code lang="html">{`
                <svg class="**${className}**">…</svg>
            `}</Code>
        </>
    )
}