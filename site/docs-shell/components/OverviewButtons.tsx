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
    <section className={clsx(className, 'mt-md@default grid-cols(1) border-left:1px|solid|var(--color-line-subtle) border-top:1px|solid|var(--color-line-subtle) grid-cols(2)@sm grid-cols(3)@lg')}>{
      children.map((definedMetadata: DefinedMetadata) =>
        <Link key={definedMetadata.pathname}
          className={clsx(
            'flex-direction:column align-items:start! justify-content:space-between! p-xl border-bottom:1px|solid|var(--color-line-subtle) border-right:1px|solid|var(--color-line-subtle) text-align:left transition:background-color|.2s surface-raised:hover',
            {
              'disabled': definedMetadata.disabled
            }
          )}
          href={definedMetadata.pathname}
          disabled={definedMetadata.disabled}
          rel="noreferrer noopener">
          <div className={clsx('font-md leading-md word-break:break-all')}>
            {$(((definedMetadata.title as any)?.absolute || definedMetadata.title) as string)}
            {definedMetadata.type === 'entity' && locale !== 'en' && typeof definedMetadata.title === 'string' && <span className='margin-left:.25em' translate="no">{definedMetadata.title}</span>}
          </div>
          {definedMetadata.description && <div className='clamp-lines(2) mt-3xs text-xs font-regular fg-text-muted'>{definedMetadata.description as string}</div>}
        </Link>
      )
    }</section >
  )
}
