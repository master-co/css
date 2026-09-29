import clsx from 'clsx'

export default function Bg(props: any) {
  return <div {...props} className={clsx(
    'display:inline-block margin-block:-.375em mr-sm outline:1px|solid outline-offset:-1px user-select:none',
    props.className,
    props.className.includes('width:') && props.className.includes('height:') ? 'r-sm' : 'height:1.5em width:1.5em r-xs',
    props.className.includes('outline:') ? '' : 'outline-subtle',
    {
      'background:var(--tiny)': props.className.includes('background-color:transparent')
    }
  )}></div>
}
