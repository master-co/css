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
            setTargetClassName('animation:slide-to-right|3s')
        })
    }, [className])
    return (
        <Demo>
            <div className='grid-cols:3'>
                <div>
                    <div className='text-center font:2xs'>from</div>
                    <IconCar className={clsx(className, 'size:12x stroke:.5 stroke:text-disabled')} strokeDasharray={1.5} />
                </div>
                <div>
                    <div className='text-center font:2xs'>origin</div>
                    <IconCar className={clsx(className, 'size:12x mb:-12x mr:-12x stroke:.5 stroke:text-disabled')} />
                    <IconCar className={clsx(className, 'app-icon-primary size:12x animation-delay:1s! stroke:.5', targetClassName)} />
                </div>
                <div>
                    <div className='text-center font:2xs'>to</div>
                    <IconCar className={clsx(className, 'size:12x stroke:.5 stroke:text-disabled')} strokeDasharray={1.5} />
                </div>
            </div>
        </Demo>
    )
}