import clsx from 'clsx'

export default function Bg(props: any) {
    return <div {...props} className={clsx(
        'inline-block mr:3x my:-.375em outline-offset:-1 outline:1|solid outline:frame user-select:none',
        props.className,
        props.className.includes('size:') ? 'r:1x' : 'r:2 size:1.5em',
        {
            'bg:tiny': props.className.includes('bg:transparent')
        }
    )}></div>
}