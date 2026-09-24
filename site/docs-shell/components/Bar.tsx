'use client'

import clsx from 'clsx'
import CountUp from 'react-countup'
import { useInView } from 'react-intersection-observer'

export default function Bar({ className, width, animated, children, color = 'text-disabled', max, value, icon, suffix, prefix }: any) {
  const [ref, inView] = useInView({ threshold: 0, triggerOnce: true })
  const resolvedWidth = `calc(${width} - (${max} - ${value}) / ${max} * ${width})`

  return (
    <div ref={ref} className={clsx('flex items-center gap:0.625rem ml:-1px flex-nowrap@sm flex-wrap@media((width<52.125rem))', className)}>
      <svg height="24" xmlns="http://www.w3.org/2000/svg" style={{ width: inView ? resolvedWidth : width }} className={clsx('hidden@media((width<52.125rem))', className, animated && 'transition:width|2s|ease-out will-change:width')}>
        <rect x="-4" y="0" height="24" width="100%" rx="4" ry="4" className={clsx(`fill-${color}`, 'stroke-subtle stroke-width:1')} />
      </svg>
      <div className="hidden@sm flex:0|0|100%@media((width<52.125rem)) order:2@media((width<52.125rem))">
        <svg height="24" xmlns="http://www.w3.org/2000/svg" style={{ width: inView ? resolvedWidth : width }} className={clsx(className, animated && 'transition:width|2s|ease-out will-change:width')}>
          <rect x="-4" y="0" height="24" width="100%" rx="4" ry="4" className={clsx(`fill-${color}`, 'stroke-subtle stroke-width:1')} />
        </svg>
      </div>
      {icon}
      <b className={`text-${color} white-space:nowrap`}>
        <CountUp
          start={max}
          end={inView && value}
          duration={2}
          prefix={prefix && (prefix + ' ')}
          suffix={suffix && (' ' + suffix)}
          easingFn={(t, b, c, d) => {
            t /= d
            return -c * t * (t - 2) + b
          }} />
      </b>
      <div className={clsx('flex:1 min-w:0', animated && 'transition:opacity|.5s|ease-out transition-delay:2s will-change:opacity')}
        style={{ opacity: inView ? 1 : 0 }}>
        {children}
      </div>
    </div>
  )
}
