import clsx from 'clsx'
import Link from './Link'

export default ({ children, className, url }: any) =>
  <section className={clsx(className, 'grid-cols(3) border-left:1px|solid|var(--color-line-subtle) border-top:1px|solid|var(--color-line-subtle)')}>{
    children.map((item: any) =>
      <Link key={item.name}
        className={clsx(
          'display:flex flex-direction:column align-items:center justify-content:center aspect-ratio:1/1 border-bottom:1px|solid|var(--color-line-subtle) border-right:1px|solid|var(--color-line-subtle) text-align:center transition:background-color|.2s bg-surface-raised:hover:not(.disabled)',
          {
            'filter:grayscale(1) disabled': item.disabled
          }
        )}
        href={item.url || `${url}/${item.path || item.name.replace(' ', '-').toLowerCase()}`}
        target={item.target}
        disabled={item.disabled}
        rel="noreferrer noopener">
        <item.src className={clsx('width:40% aspect-ratio:1/1', item.className)} width={40} height={40}></item.src>
        <div className={clsx('margin-top:0.625rem font-2xs', item.name.length < 17 && 'font-xs@sm', item.disabled && 'fg-text-disabled')}>{item.name}</div>
      </Link>
    )
  }</section >
