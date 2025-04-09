'use client'

import Demo from 'internal/components/Demo'
import clsx from 'clsx'
import { IconCar } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

export default function BasicDemo({ className }: any) {
    const [targetClassName, setTargetClassName] = useState('')
    useEffect(() => {
        setTargetClassName('')
        setTimeout(() => {
            setTargetClassName('@slide-to-right|3s')
        })
    }, [className])
    return (
        <Demo>
            <div className='grid-cols:3'>
                <div>
                    <div className='font:10 text:center'>from</div>
                    <IconCar className={clsx(className, 'size:12x stroke:.5 stroke:text-lightest')} strokeDasharray={1.5} />
                </div>
                <div>
                    <div className='font:10 text:center'>origin</div>
                    <IconCar className={clsx(className, 'size:12x mb:-48 mr:-48 stroke:.5 stroke:text-lightest')} />
                    <IconCar className={clsx(className, 'app-icon-primary size:12x @delay:1s! stroke:.5', targetClassName)} />
                </div>
                <div>
                    <div className='font:10 text:center'>to</div>
                    <IconCar className={clsx(className, 'size:12x stroke:.5 stroke:text-lightest')} strokeDasharray={1.5} />
                </div>
            </div>
        </Demo>
    )
}