import { IconExternalLink } from '@tabler/icons-react'
import Image from './Image'
import Link from './Link'
import clsx from 'clsx'

export default function ImageCallToPreview({ dark, href, alt, ...props }: any) {
  return (
    <Link href={href} target="_blank" className="relative block (mask-image:linear-gradient(black,black|60%,transparent)) (content:none)::after visible:hover_.info">
      {dark && <Image src={dark} width={props.width} height={props.height} alt={alt} placeholder="blur" className={clsx('r-md hidden@apply(--site-light)', `(aspect-ratio:${props.width}/${props.height})`)} />}
      <Image src={props} width={props.width} height={props.height} alt={alt} placeholder="blur" className={clsx('r-md', `(aspect-ratio:${props.width}/${props.height})`, { 'hidden@apply(--site-dark)': dark })} />
      {href &&
        <div className='absolute (inset:0) flex items-center justify-center (height:100%) (width:100%)'>
          <div className='invisible (padding-bottom:0.938rem) (padding-left:1.563rem) (padding-right:1.563rem) (padding-top:0.938rem) b-line-subtle (border-radius:10px) (border-style:solid) (border-width:1px) font-sm bg-surface-raised/.5 (backdrop-filter:blur(25px)) info'>
            {href}
            <IconExternalLink className='inline-flex (margin-bottom:-0.25rem) (margin-left:0.625rem) (margin-right:-0.313rem) (margin-top:-0.25rem) font-regular stroke-text-muted (stroke-width:1.3)' width={20} height={20} />
          </div>
        </div>
      }
    </Link>
  )
}
