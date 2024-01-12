'use client'

import Demo from 'websites/components/Demo'
import DemoPanel from 'websites/components/DemoPanel'
import Image from 'next/image'
import { l } from 'to-line'
import { IconCar } from '@tabler/icons-react'
import Code from 'websites/components/Code'
import CodeTabs from 'websites/components/CodeTabs'
import dedent from 'ts-dedent'
import { useEffect, useState } from 'react'

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
                        <IconCar className={l(className, 'stroke:.5 stroke:text-lightest size:12x')} strokeDasharray={1.5} />
                    </div>
                    <div>
                        <div className='font:10 text:center'>origin</div>
                        <IconCar className={l(className, 'stroke:.5 stroke:text-lightest size:12x mr:-48 mb:-48')} />
                        <IconCar className={l(className, 'app-icon-primary stroke:.5 size:12x @delay:1s!', targetClassName)} />
                    </div>
                    <div>
                        <div className='font:10 text:center'>to</div>
                        <IconCar className={l(className, 'stroke:.5 stroke:text-lightest size:12x')} strokeDasharray={1.5} />
                    </div>
                </div>
            </Demo>
            <Code lang="html">{`<svg class="**${className}** @slide-to-right|3s @delay:1s!">…</svg>`}</Code>
        </>
    )
}