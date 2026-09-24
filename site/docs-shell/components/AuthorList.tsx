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
    <div className={clsx('flex', className)}>
      {children.map((eachAuthor: any) => {
        const author = authors.find((x: any) => x.name === eachAuthor.name) as any
        const Wrapper = isLink ? Link : 'div'
        return (
          <Wrapper
            key={author.name}
            className={clsx('flex items-center', {
              'gap:sm': size === 'md',
              'gap:xs': size === 'sm' || size === 'xs',
            })}
            {...(isLink ? { href: author?.url } : {})}
          >
            <Image
              className={clsx('round object-cover', {
                'outline:1px|solid|subtle outline-offset:3xs': size === 'md'
              })}
              src={author.image}
              width={avatarSize}
              height={avatarSize}
              alt={author.name}
            />
            <div className="flex flex-col gap:3xs">
              <div className={clsx('', {
                'font-weight:460 font:sm text:strong': size === 'md',
                'font:xs': size === 'sm' || size === 'xs',
              })}
              >
                {author.name}
              </div>
              {size === 'md' && <div className="font:2xs text:muted">{author.twitter}</div>}
            </div>
          </Wrapper>
        )
      })}
    </div>
  )
}
