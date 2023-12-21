import Demo from 'websites/components/Demo'
import DemoPanel from 'websites/components/DemoPanel'
import Image from 'next/image'
import { l } from 'to-line'
import { IconRefresh, IconRotate, IconRotateClockwise } from '@tabler/icons-react'
import Code from 'websites/components/Code'

export default ({ className }: any) => {
    const iconClassName = l(className, 'app-icon-primary stroke:.5 size:12x @rotate|1s|linear|infinite')
    return (
        <>
            <Demo>
                {className === '@direction:normal' && <IconRotateClockwise className={iconClassName} />}
                {className === '@direction:reverse' && <IconRotate className={iconClassName} />}
                {className === '@direction:alternate' && <IconRefresh className={iconClassName} />}
                {className === '@direction:alt' && <IconRefresh className={iconClassName} />}
                {className === '@direction:alternate-reverse' && <IconRefresh className={iconClassName} />}
                {className === '@direction:alt-reverse' && <IconRefresh className={iconClassName} />}
            </Demo>
            <Code lang="html">{`
                <svg class="**${className}** @rotate|1s|linear|infinite">…</svg>
            `}</Code>
        </>
    )
}