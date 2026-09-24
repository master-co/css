import { IconExternalLink } from '@tabler/icons-react'
import Image from 'next/image'
import Link from './Link'
import clsx from 'clsx'

export default function ImageCallToPreview({ dark, href, alt, ...props }: any) {
  return (
    <Link href={href} target="_blank" className="rel block mask-image:linear-gradient(black,black|60%,transparent) content:none::after visible:hover_.info">
      {dark && <Image src={dark} width={props.width} height={props.height} alt={alt} placeholder="blur" className={clsx('r:md outline:1px|solid|subtle outline-offset:-1px hidden@light', `aspect-ratio:${props.width}/${props.height}`)} />}
      <Image src={props} width={props.width} height={props.height} alt={alt} placeholder="blur" className={clsx('r:md outline:1px|solid|subtle outline-offset:-1px', `aspect-ratio:${props.width}/${props.height}`, { 'hidden@dark': dark })} />
      {href &&
        <div className='abs inset:0 flex items-center justify-center full'>
          <div className='invisible p:0.938rem|1.563rem b:1px|solid|subtle r:10px font:sm surface:raised/.5 backdrop-filter:blur(25px) info'>
            {href}
            <IconExternalLink className='inline-flex m:-1x|-0.313rem|-1x|0.625rem font:regular stroke:text-muted stroke:1.3' width={20} height={20} />
          </div>
        </div>
      }
    </Link>
  )
}
