'use client'

import clsx from 'clsx'
import LogotypeAtDark from '../../public/images/css-logotype@dark.svg'
import LogotypeAtLight from '../../public/images/css-logotype@light.svg'
import { SVGProps } from 'react'

export default function CSSLogotype({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <>
      <LogotypeAtDark {...props} className={clsx(className, 'hidden@light')} />
      <LogotypeAtLight {...props} className={clsx(className, 'hidden@dark')} />
    </>
  )
}