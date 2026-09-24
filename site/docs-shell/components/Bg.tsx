import clsx from 'clsx'

export default function Bg(props: any) {
  return <div {...props} className={clsx(
    'inline-block my:-.375em mr-sm outline:1px|solid outline-offset:-1px user-select:none',
    props.className,
    props.className.includes('size:') ? 'r-sm' : 'size:1.5em r-xs',
    props.className.includes('outline:') ? '' : 'outline-subtle',
    {
      'background:var(--tiny)': props.className.includes('background-color:transparent')
    }
  )}></div>
}
