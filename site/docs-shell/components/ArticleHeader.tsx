import ChevronLeftSvg from '../../public/images/chevron-left.svg'
import Link from './Link'
import dayjs from 'dayjs'
import clsx from 'clsx'
import type { CSSProperties } from 'react'
import { createTranslation } from '../utils/i18n'
import PackageBadges from './PackageBadges'
import brands from '../data/brands'

const headerIconClassName = 'display:block width:100% height:100% max-width:100% max-height:100%'
const headerIconStyle = {
  display: 'block',
  width: '100%',
  height: '100%',
  maxWidth: '100%',
  maxHeight: '100%'
} satisfies CSSProperties
const headerIconOuterStyle = {
  alignSelf: 'center',
  flex: '0 0 auto',
  width: 'fit-content'
} satisfies CSSProperties
const headerIconSlotStyle = {
  width: 'clamp(4.5rem,7vw,5rem)',
  height: 'clamp(4.5rem,7vw,5rem)'
} satisfies CSSProperties

export default async function ArticleHeader(props: any) {
  let { h1ClassName, metadata, icon, end, date, center, locale, categoryLink, dictionaries, toc } = props
  const $ = await createTranslation(locale, dictionaries)
  const Category = ({ children }: any) => {
    const categoryClasses = clsx('mb-sm font-size-sm font-weight:460 letter-spacing:.01em', { 'fg-accent': !categoryLink })
    return (
      categoryLink
        ? (
          <Link href={typeof categoryLink === 'string' ? categoryLink : './'} className={clsx(
            'display:block width:fit-content fg-text-muted',
            date ? 'margin-bottom:1.25rem' : categoryClasses,
            center && 'margin-inline:auto'
          )}>
            <ChevronLeftSvg className={clsx(
              'display:inline-block margin-left:-0.313rem margin-right:0.313rem stroke-text-muted stroke-width:2',
              date ? 'height:20px width:20px margin-block:-0.25rem' : 'height:16px width:16px margin-block:-0.188rem'
            )} />
            {children}
          </Link>
        )
        : <div className={categoryClasses}>{$(children)}</div>
    )
  }
  if (typeof icon === 'string') {
    const brand = brands[icon as keyof typeof brands]
    if (!brand) {
      throw new Error(`Brand ${icon} not found`)
    }
    icon = <brand.src className={clsx(headerIconClassName, brand.headerClassName)} style={headerIconStyle} />
  }
  return (
    <>
      <div className="display:flex flex-wrap:nowrap gap-xl flex-direction:column@media((width<37.5rem))">
        <div className='flex:1'>
          {metadata.category && <Category>{$(metadata.category)}</Category>}
          {date && <Category>{dayjs(date).format('MMMM D, YYYY')}</Category>}
          <h1 className={clsx(
            'max-width:52.125rem margin-top:0 font-size:28px leading-xs tracking-tight text-wrap:wrap fg-text-strong font-size-3xl@sm',
            h1ClassName,
            {
              'font-size-4xl@md': metadata.type !== 'entity' && !toc
            }
          )}>
            {$(metadata.title.absolute || metadata.title)}
            {metadata.type === 'entity' && locale !== 'en' && <span className='margin-left:.25em'>{metadata.title}</span>}
            {metadata.unfinished && <span className='margin-left:.5em font-size:.5em vertical-align:top'>🚧</span>}
          </h1>
        </div >
        <div className={clsx('display:flex gap-xs display:none:empty', center ? 'align-items:center' : 'align-items:start')}>
          {end}
        </div>
        {icon && <div className='display:grid flex-grow:0 flex-shrink:0 flex-basis:auto place-content:center margin-inline:auto@media((width<37.5rem))' style={headerIconOuterStyle}>
          <div className="display:grid place-content:center height:4.5rem width:4.5rem height:5rem@sm width:5rem@sm" style={headerIconSlotStyle}>
            {icon}
          </div>
        </div>}
      </div >
      {metadata.package && <PackageBadges {...metadata.package} translate={$} />}
      <p className={clsx('max-width:48rem text-md text-wrap:pretty', {
        'text-lg@sm': metadata.type !== 'entity' && !toc,
      })}>{$(metadata.description)}</p>
      {
        (metadata.unfinished || metadata.disabled) &&
        <div className="margin-block:1.25rem padding-top:0.797rem padding-right:1.25rem padding-bottom:0.797rem padding-left:1.25rem r-lg text-xs font-weight:460 bg-accent/.1 fg-accent">
          <span className='margin-right:0.625rem'>🚧</span>{$('This page is still under construction and some content may not be complete.')}
        </div>
      }
    </>
  )
}
