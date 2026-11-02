import clsx from 'clsx'
import Link from './Link'
import { DefinedMetadata } from '../types/Metadata'
import { useLocale } from '../contexts/locale'
import { useTranslation } from '../contexts/i18n'

export default ({ children, className }: any) => {
  const $ = useTranslation()
  const locale = useLocale()
  return (
    <section className={clsx(className, 'mt-md@layer(defaults) grid-cols(1) bl-solid bl(1) bt-solid bt(1) bl-line-subtle bt-line-subtle grid-cols(2)@sm grid-cols(3)@lg')}>{
      children.map((definedMetadata: DefinedMetadata) =>
        <Link key={definedMetadata.pathname}
          className={clsx(
            'flex-col items-start! justify-between! p-xl bb-solid bb(1) br-solid br(1) bb-line-subtle br-line-subtle text-left (transition-duration:var(--duration-normal)) (transition-property:background-color) bg-surface-raised:hover',
            {
              'disabled': definedMetadata.disabled
            }
          )}
          href={definedMetadata.pathname}
          disabled={definedMetadata.disabled}
          rel="noreferrer noopener">
          <div className={clsx('font-md leading-md (word-break:break-all)')}>
            {$(((definedMetadata.title as any)?.absolute || definedMetadata.title) as string)}
            {definedMetadata.type === 'entity' && locale !== 'en' && typeof definedMetadata.title === 'string' && <span className='(margin-left:.25em)' translate="no">{definedMetadata.title}</span>}
          </div>
          {definedMetadata.description && <div className='clamp-lines(2) mt-3xs text-xs font-regular fg-text-muted'>{definedMetadata.description as string}</div>}
        </Link>
      )
    }</section >
  )
}
