'use client'

import Demo from 'websites/components/Demo'
import { IconCar } from '@tabler/icons-react'
import Code from 'websites/components/Code'
import { useEffect, useState } from 'react'
import clsx from 'clsx'

export default ({ className }: any) => {
    const [targetClassName, setTargetClassName] = useState('')
    useEffect(() => {
        setTargetClassName('')
        setTimeout(() => {
            setTargetClassName('@slide-to-right|3s')
        })
    }, [className])
    return (
        <>
            <Demo>
                <div className='grid-cols:3'>
                    <div>
                        <div className='font:10 text:center'>from</div>
                        <IconCar className={clsx(className, 'size:12x stroke:.5 stroke:text-lightest')} strokeDasharray={1.5} />
                    </div>
                    <div>
                        <div className='font:10 text:center'>origin</div>
                        <IconCar className={clsx(className, 'mb:-48 mr:-48 size:12x stroke:.5 stroke:text-lightest')} />
                        <IconCar className={clsx(className, 'app-icon-primary @delay:1s! size:12x stroke:.5', targetClassName)} />
                    </div>
                    <div>
                        <div className='font:10 text:center'>to</div>
                        <IconCar className={clsx(className, 'size:12x stroke:.5 stroke:text-lightest')} strokeDasharray={1.5} />
                    </div>
                </div>
            </Demo>
            <Code lang="html">{`<svg class="**${className}** @slide-to-right|3s @delay:1s!">…</svg>`}</Code>
        </>
    )
}