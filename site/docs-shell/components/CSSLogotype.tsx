import clsx from 'clsx'
import LogotypeAtDark from '../../public/brand/v2/logo/master-css/master-css-horizontal-on-dark.svg'
import LogotypeAtLight from '../../public/brand/v2/logo/master-css/master-css-horizontal-on-light.svg'
import { SVGProps } from 'react'

export default function CSSLogotype({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <>
      <LogotypeAtDark {...props} className={clsx(className, 'hidden@apply(--site-light)')} />
      <LogotypeAtLight {...props} className={clsx(className, 'hidden@apply(--site-dark)')} />
    </>
  )
}
