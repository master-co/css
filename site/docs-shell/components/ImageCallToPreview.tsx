import { IconExternalLink } from '@tabler/icons-react'
import Image from 'next/image'
import Link from './Link'
import clsx from 'clsx'

export default function ImageCallToPreview({ dark, href, alt, ...props }: any) {
  return (
    <Link href={href} target="_blank" className="position:relative display:block mask-image:linear-gradient(black,black|60%,transparent) content:none::after visibility:visible:hover_.info">
      {dark && <Image src={dark} width={props.width} height={props.height} alt={alt} placeholder="blur" className={clsx('r-md outline-width:1px outline-style:solid outline-line-subtle outline-offset:-1px display:none@apply(--site-light)', `aspect-ratio:${props.width}/${props.height}`)} />}
      <Image src={props} width={props.width} height={props.height} alt={alt} placeholder="blur" className={clsx('r-md outline-width:1px outline-style:solid outline-line-subtle outline-offset:-1px', `aspect-ratio:${props.width}/${props.height}`, { 'display:none@apply(--site-dark)': dark })} />
      {href &&
        <div className='position:absolute inset:0 display:flex align-items:center justify-content:center height:100% width:100%'>
          <div className='visibility:hidden padding-top:0.938rem padding-right:1.563rem padding-bottom:0.938rem padding-left:1.563rem border-radius:10px border-width:1px border-style:solid b-line-subtle font-size-sm bg-surface-raised/.5 backdrop-filter:blur(25px) info'>
            {href}
            <IconExternalLink className='display:inline-flex margin-top:-0.25rem margin-right:-0.313rem margin-bottom:-0.25rem margin-left:0.625rem font-weight-regular stroke-text-muted stroke-width:1.3' width={20} height={20} />
          </div>
        </div>
      }
    </Link>
  )
}
