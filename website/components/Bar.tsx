'use client'

import clsx from 'clsx'
import CountUp from 'react-countup'
import { useInView } from 'react-intersection-observer'

export default function Bar({ className, width, animated, children, color = 'text-lightest', max, value, icon, suffix, prefix }: any) {
    const [ref, inView] = useInView({ threshold: 0, triggerOnce: true })
    return (
        <div ref={ref} className={clsx('flex align-items:center flex-wrap:nowrap gap:10 ml:-1', className)}>
            {/* eslint-disable-next-line @master/css/class-validation */}
            <svg height="24" xmlns="http://www.w3.org/2000/svg" style={{ width: inView ? `calc(${width} - (${max} - ${value}) / ${max} * ${width})` : width }} className={clsx(className, animated && '~width|2s|ease-out will-change:width')}>
                <rect x="-4" y="0" height="24" width="100%" rx="4" ry="4" className={clsx(`fill:${color}`, 'stroke:1 stroke:frame calc(100%+4)')} />
            </svg>
            {icon}
            {/* eslint-disable-next-line @master/css/class-validation */}
            <b className={`fg:${color} white-space:nowrap`}>
                <CountUp start={max}
                    end={inView && value}
                    duration={2}
                    prefix={prefix && (prefix + ' ')}
                    suffix={suffix && (' ' + suffix)}
                    easingFn={(t, b, c, d) => {
                        t /= d
                        return -c * t * (t - 2) + b
                    }} />
            </b>
            <div className={clsx(animated && '~opacity|.5s|ease-out transition-delay:2s will-change:opacity white-space:nowrap')}
                style={{ opacity: inView ? 1 : 0 }}>
                {children}
            </div>
        </div>
    )
}