'use client'

import { l } from 'to-line';
import LogotypeAtDark from 'websites-shared/svgs/master-css.logotype@dark.svg';
import LogotypeAtLight from 'websites-shared/svgs/master-css.logotype@light.svg';

export function Logotype({ className, ...props }: any) {
    return (
        <>
            <LogotypeAtDark {...props} className={l(className, 'hide@light')} />
            <LogotypeAtLight {...props} className={l(className, 'hide@dark')} />
        </>
    )
}