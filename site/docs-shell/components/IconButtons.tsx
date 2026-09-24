import clsx from 'clsx'
import Link from './Link'

export default ({ children, className, url }: any) =>
  <section className={clsx(className, 'grid-cols:3 bl:1px|solid|var(--color-line-subtle) bt:1px|solid|var(--color-line-subtle)')}>{
    children.map((item: any) =>
      <Link key={item.name}
        className={clsx(
          'flex flex-col items-center justify-center square bb:1px|solid|var(--color-line-subtle) br:1px|solid|var(--color-line-subtle) text-center transition:background-color|.2s surface-raised:hover:not(.disabled)',
          {
            'filter:grayscale(1) disabled': item.disabled
          }
        )}
        href={item.url || `${url}/${item.path || item.name.replace(' ', '-').toLowerCase()}`}
        target={item.target}
        disabled={item.disabled}
        rel="noreferrer noopener">
        <item.src className={clsx('w:40% square', item.className)} width={40} height={40}></item.src>
        <div className={clsx('mt:0.625rem font-2xs', item.name.length < 17 && 'font-xs@sm', item.disabled && 'text-disabled')}>{item.name}</div>
      </Link>
    )
  }</section >
