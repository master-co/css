'use client'

import { l } from 'to-line'
import LogotypeAtDark from 'websites/svgs/master-css.logotype@dark.svg?inlineSvg'
import LogotypeAtLight from 'websites/svgs/master-css.logotype@light.svg?inlineSvg'

export function Logotype({ className, ...props }: any) {
    return (
        <>
            <LogotypeAtDark {...props} className={l(className, 'hide@light')} />
            <LogotypeAtLight {...props} className={l(className, 'hide@dark')} />
        </>
    )
}