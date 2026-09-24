import ChevronLeftSvg from '../../public/images/chevron-left.svg'
import Link from './Link'
import dayjs from 'dayjs'
import clsx from 'clsx'
import type { CSSProperties } from 'react'
import { createTranslation } from '../utils/i18n'
import PackageBadges from './PackageBadges'
import brands from '../data/brands'

const headerIconClassName = 'block full max-w:full max-h:full'
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
    const categoryClasses = clsx('mb:sm font-weight:460 font:sm tracking:.01em', { 'fg:accent': !categoryLink })
    return (
      categoryLink
        ? (
          <Link href={typeof categoryLink === 'string' ? categoryLink : './'} className={clsx(
            'block w:fit text:muted',
            date ? 'mb:5x' : categoryClasses,
            center && 'mx:auto'
          )}>
            <ChevronLeftSvg className={clsx(
              'inline-block ml:-0.313rem mr:0.313rem stroke:text-muted stroke:2',
              date ? 'size:20px my:-1x' : 'size:16px my:-0.188rem'
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
      <div className="flex flex-nowrap gap:xl flex-col@<2xs">
        <div className='flex:1'>
          {metadata.category && <Category>{$(metadata.category)}</Category>}
          {date && <Category>{dayjs(date).format('MMMM D, YYYY')}</Category>}
          <h1 className={clsx(
            'max-w:breakpoint-sm mt:0 font:28px leading:xs tracking:tight text-wrap text:strong font:3xl@sm',
            h1ClassName,
            {
              'font:4xl@md': metadata.type !== 'entity' && !toc
            }
          )}>
            {$(metadata.title.absolute || metadata.title)}
            {metadata.type === 'entity' && locale !== 'en' && <span className='ml:.25em'>{metadata.title}</span>}
            {metadata.unfinished && <span className='ml:.5em font:.5em vertical-align:top'>🚧</span>}
          </h1>
        </div >
        <div className={clsx('flex gap:xs hidden:empty', center ? 'items-center' : 'items-start')}>
          {end}
        </div>
        {icon && <div className='grid flex:0|0|auto place-content:center mx:auto@<2xs' style={headerIconOuterStyle}>
          <div className="grid place-content:center size:18x size:20x@sm" style={headerIconSlotStyle}>
            {icon}
          </div>
        </div>}
      </div >
      {metadata.package && <PackageBadges {...metadata.package} translate={$} />}
      <p className={clsx('max-w:breakpoint-xs text:md text-pretty', {
        'text:lg@sm': metadata.type !== 'entity' && !toc,
      })}>{$(metadata.description)}</p>
      {
        (metadata.unfinished || metadata.disabled) &&
        <div className="my:5x p:0.797rem|5x r:lg text:xs font-weight:460 bg:accent/.1 fg:accent">
          <span className='mr:0.625rem'>🚧</span>{$('This page is still under construction and some content may not be complete.')}
        </div>
      }
    </>
  )
}
