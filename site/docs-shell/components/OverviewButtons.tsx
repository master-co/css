import clsx from 'clsx'
import Link from './Link'
import { DefinedMetadata } from '../types/Metadata'
import { useLocale } from '../contexts/locale'
import { useTranslation } from '../contexts/i18n'

export default ({ children, className }: any) => {
  const $ = useTranslation()
  const locale = useLocale()
  return (
    <section className={clsx(className, 'mt-md@layer(defaults) grid-cols(1) bl-line-subtle bt-line-subtle border-left-style:solid border-left-width:1px border-top-style:solid border-top-width:1px grid-cols(2)@sm grid-cols(3)@lg')}>{
      children.map((definedMetadata: DefinedMetadata) =>
        <Link key={definedMetadata.pathname}
          className={clsx(
            'flex-direction:column align-items:start! justify-content:space-between! p-xl bb-line-subtle br-line-subtle border-bottom-style:solid border-bottom-width:1px border-right-style:solid border-right-width:1px text-align:left transition-duration:0.2s transition-property:background-color bg-surface-raised:hover',
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
