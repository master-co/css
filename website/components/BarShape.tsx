'use client'

import clsx from 'clsx'
import { useInView } from 'react-intersection-observer'

export default ({ className, children, animated, width }: any) => {
    const [ref, inView] = useInView({
        threshold: 0,
        triggerOnce: true
    })
    return (
        <div ref={ref}
            className={clsx(className, 'b:1|frame contain:strict h:24 rr:1x', animated && '~width|2s|ease-in-out will-change:width')}
            style={{
                width: inView ? width : '50%'
            }}>
            {children}
        </div>
    )
}