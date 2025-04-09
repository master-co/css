import Link from 'internal/components/Link'
import clsx from 'clsx'

export default (props: any) => {
    return (
        <Link {...props} className={clsx(`center-content flex r:5 text-decoration:none! my:10 px:4x font:14 font:semibold h:44`, {
            'b:1 bg:primary fg:text-primary fg:black:hover b:black/.1@light b:white/.2@dark': !props.disabled,
            'bg:gray-15@dark bg:slate-95@light': props.disabled
        })}>
            {props.children}
        </Link>
    )
}