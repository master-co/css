import clsx from 'clsx'
import Link from './Link'

export default ({ children, className, url }: any) =>
  <section className={clsx(className, 'grid-cols(3) bl-line-subtle bt-line-subtle bl-solid bl(1) bt-solid bt(1)')}>{
    children.map((item: any) =>
      <Link key={item.name}
        className={clsx(
          'flex flex-col items-center justify-center (aspect-ratio:1/1) bb-line-subtle br-line-subtle bb-solid bb(1) br-solid br(1) text-center (transition-duration:0.2s) (transition-property:background-color) bg-surface-raised:hover:not(.disabled)',
          {
            '(filter:grayscale(1)) disabled': item.disabled
          }
        )}
        href={item.url || `${url}/${item.path || item.name.replace(' ', '-').toLowerCase()}`}
        target={item.target}
        disabled={item.disabled}
        rel="noreferrer noopener">
        <item.src className={clsx('(width:40%) (aspect-ratio:1/1)', item.className)} width={40} height={40}></item.src>
        <div className={clsx('(margin-top:0.625rem) font-2xs', item.name.length < 17 && 'font-xs@sm', item.disabled && 'fg-text-disabled')}>{item.name}</div>
      </Link>
    )
  }</section >
