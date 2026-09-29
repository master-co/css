import clsx from 'clsx'
import Link from './Link'

export default ({ children, className, url }: any) =>
  <section className={clsx(className, 'grid-cols(3) border-left-width:1px border-left-style:solid bl-line-subtle border-top-width:1px border-top-style:solid bt-line-subtle')}>{
    children.map((item: any) =>
      <Link key={item.name}
        className={clsx(
          'display:flex flex-direction:column align-items:center justify-content:center aspect-ratio:1/1 border-bottom-width:1px border-bottom-style:solid bb-line-subtle border-right-width:1px border-right-style:solid br-line-subtle text-align:center transition-property:background-color transition-duration:0.2s bg-surface-raised:hover:not(.disabled)',
          {
            'filter:grayscale(1) disabled': item.disabled
          }
        )}
        href={item.url || `${url}/${item.path || item.name.replace(' ', '-').toLowerCase()}`}
        target={item.target}
        disabled={item.disabled}
        rel="noreferrer noopener">
        <item.src className={clsx('width:40% aspect-ratio:1/1', item.className)} width={40} height={40}></item.src>
        <div className={clsx('margin-top:0.625rem font-size-2xs', item.name.length < 17 && 'font-size-xs@sm', item.disabled && 'fg-text-disabled')}>{item.name}</div>
      </Link>
    )
  }</section >
