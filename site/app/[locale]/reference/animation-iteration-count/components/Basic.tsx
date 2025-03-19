import Demo from 'internal/components/Demo'
import DemoPanel from 'internal/components/DemoPanel'
import Image from 'next/image'
import clsx from 'clsx'
import { IconRefresh, IconRotateClockwise } from '@tabler/icons-react'
import Code from 'internal/components/Code'

export default ({ className }: any) => {
    return (
        <>
            <Demo>
                <IconRotateClockwise className="size:12x stroke:.5 stroke:text-lightest" strokeDasharray={1.5} />
                <IconRotateClockwise className={clsx(className, 'app-icon-primary size:12x stroke:.5')} />
            </Demo>
            <Code lang="html">{`
                <!-- @MARK ${className} -->
                <svg class="${className}">…</svg>
            `}</Code>
        </>
    )
}