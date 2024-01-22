import Demo from 'websites/components/Demo'
import DemoPanel from 'websites/components/DemoPanel'
import Image from 'next/image'
import clsx from 'clsx'
import { IconUfo } from '@tabler/icons-react'
import Code from 'websites/components/Code'

export default ({ className }: any) => {
    return (
        <>
            <Demo>
                <IconUfo className={clsx(className, 'mr:-48 size:12x stroke:.5 stroke:text-lightest')} strokeDasharray={1.5} />
                <IconUfo className={clsx(className, 'app-icon-primary @float|3s|ease-in-out|infinite size:12x stroke:.5')} />
            </Demo>
            <Code lang="html">{`
                <svg class="**${className}** ${className.includes('running') ? '@float|3s|ease-in-out|infinite|paused' : '@float|3s|ease-in-out|infinite'}">…</svg>
            `}</Code>
        </>
    )
}