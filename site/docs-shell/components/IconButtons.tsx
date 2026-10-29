import clsx from 'clsx'
import Link from './Link'

export default ({ children, className, url }: any) =>
  <section className={clsx(className, 'grid-cols(3) bl-line-subtle bt-line-subtle border-left-style:solid border-left-width:1px border-top-style:solid border-top-width:1px')}>{
    children.map((item: any) =>
      <Link key={item.name}
        className={clsx(
          'display:flex flex-direction:column align-items:center justify-content:center aspect-ratio:1/1 bb-line-subtle br-line-subtle border-bottom-style:solid border-bottom-width:1px border-right-style:solid border-right-width:1px text-align:center transition-duration:0.2s transition-property:background-color bg-surface-raised:hover:not(.disabled)',
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
