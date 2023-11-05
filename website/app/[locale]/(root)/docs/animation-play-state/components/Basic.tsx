import Demo from 'shared/components/Demo'
import DemoPanel from 'shared/components/DemoPanel'
import Image from 'next/image'
import { l } from 'to-line'
import { IconUfo } from '@tabler/icons-react'
import Code from 'shared/components/Code'

export default ({ className }: any) => {
    return (
        <>
            <Demo>
                <IconUfo className={l(className, 'stroke:.5 stroke:dim 48x48 mr:-48')} strokeDasharray={1.5} />
                <IconUfo className={l(className, 'app-icon-primary stroke:.5 48x48 @float|3s|ease-in-out|infinite')} />
            </Demo>
            <Code lang="html">{`
                <svg class="**${className}** ${className.includes('running') ? '@float|3s|ease-in-out|infinite|paused' : '@float|3s|ease-in-out|infinite'}">…</svg>
            `}</Code>
        </>
    )
}