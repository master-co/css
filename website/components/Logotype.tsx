'use client'

import clsx from 'clsx'
import Image from 'next/image'
import LogotypeAtDark from 'websites/svgs/master-css.logotype@dark.svg'
import LogotypeAtLight from 'websites/svgs/master-css.logotype@light.svg'

export function Logotype({ className, ...props }: any) {
    return (
        <>
            <Image src={LogotypeAtDark} alt="Master CSS logotype" {...props} className={clsx(className, 'hide@light')} loading="eager" />
            <Image src={LogotypeAtLight} alt="Master CSS dark logotype"{...props} className={clsx(className, 'hide@dark')} loading="eager" />
        </>
    )
}