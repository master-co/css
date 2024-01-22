import Link from 'websites/components/Link'
import clsx from 'clsx'

export default (props: any) => {
    return (
        <Link {...props} className={clsx(`
            center-content flex font:14 font:semibold h:44 my:10 px:4x r:5 text-decoration:none!
        `, {
            'bg:primary fg:text-primary b:1 b:black/.1@light b:white/.2@dark': !props.disabled,
            'bg:slate-95@light bg:gray-15@dark': props.disabled
        })}>
            {props.children}
        </Link>
    )
}