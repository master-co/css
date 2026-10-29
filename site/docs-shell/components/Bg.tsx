import clsx from 'clsx'

export default function Bg(props: any) {
  return <div {...props} className={clsx(
    'display:inline-block mr-sm margin-block:-.375em outline-color:initial outline-offset:-1px outline-style:solid outline-width:1px user-select:none',
    props.className,
    props.className.includes('width:') && props.className.includes('height:') ? 'r-sm' : 'height:1.5em width:1.5em r-xs',
    props.className.includes('outline:') ? '' : 'outline-line-subtle',
    {
      'background-image:var(--tiny-image) background-position:center': props.className.includes('background-color:transparent')
    }
  )}></div>
}
