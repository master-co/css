'use client'

import clsx from 'clsx'
import Link from './Link'
import { DefinedMetadata } from '../types/Metadata'
import { useLocale } from '../contexts/locale'
import { useTranslation } from '../contexts/i18n'

export default ({ children, className }: any) => {
  const $ = useTranslation()
  const locale = useLocale()
  return (
    <section className={clsx(className, 'mt:md@default grid-cols:1 bl:1px|solid|subtle bt:1px|solid|subtle grid-cols:2@sm grid-cols:3@lg')}>{
      children.map((definedMetadata: DefinedMetadata) =>
        <Link key={definedMetadata.pathname}
          className={clsx(
            'flex-col items-start! justify-between! p:xl bb:1px|solid|subtle br:1px|solid|subtle text-left transition:background-color|.2s surface:raised:hover',
            {
              'disabled': definedMetadata.disabled
            }
          )}
          href={definedMetadata.pathname}
          disabled={definedMetadata.disabled}
          rel="noreferrer noopener">
          <div className={clsx('font:md leading:md word-break:break-all')}>
            {$(((definedMetadata.title as any)?.absolute || definedMetadata.title) as string)}
            {definedMetadata.type === 'entity' && locale !== 'en' && typeof definedMetadata.title === 'string' && <span className='ml:.25em' translate="no">{definedMetadata.title}</span>}
          </div>
          {definedMetadata.description && <div className='line-clamp:2 mt:3xs text:xs font:regular text:muted'>{definedMetadata.description as string}</div>}
        </Link>
      )
    }</section >
  )
}
