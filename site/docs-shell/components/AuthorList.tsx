import Image from 'next/image'
import authors from '../data/authors'
import clsx from 'clsx'
import Link from './Link'

export default function AuthorList({ children, className, size = 'md', isLink }: { children: any, className?: string, size?: string, isLink?: boolean }) {
  let avatarSize = 36
  switch (size) {
    case 'md':
      avatarSize = 36
      break
    case 'sm':
      avatarSize = 28
      break
    case 'xs':
      avatarSize = 20
      break
    default:
      avatarSize = 36
  }
  return (
    <div className={clsx('display:flex', className)}>
      {children.map((eachAuthor: any) => {
        const author = authors.find((x: any) => x.name === eachAuthor.name) as any
        const Wrapper = isLink ? Link : 'div'
        return (
          <Wrapper
            key={author.name}
            className={clsx('display:flex align-items:center', {
              'gap-sm': size === 'md',
              'gap-xs': size === 'sm' || size === 'xs',
            })}
            {...(isLink ? { href: author?.url } : {})}
          >
            <Image
              className={clsx('aspect-ratio:1/1 border-radius:50% object-fit:cover', {
                'outline-width:1px outline-style:solid outline-line-subtle outline-offset-3xs': size === 'md'
              })}
              src={author.image}
              width={avatarSize}
              height={avatarSize}
              alt={author.name}
            />
            <div className="display:flex flex-direction:column gap-3xs">
              <div className={clsx('', {
                'font-size-sm font-weight:460 fg-text-strong': size === 'md',
                'font-size-xs': size === 'sm' || size === 'xs',
              })}
              >
                {author.name}
              </div>
              {size === 'md' && <div className="font-size-2xs fg-text-muted">{author.twitter}</div>}
            </div>
          </Wrapper>
        )
      })}
    </div>
  )
}
