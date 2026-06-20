import Link from 'internal/components/Link'
import clsx from 'clsx'

export default (props: any) => {
    return (
        <Link {...props} className={clsx(`flex items-center justify-center r:md text-decoration:none! margin-block:sm pi:md font:sm font:medium h:11x`, {
            'b:1px bg:primary text:primary text:black:hover b:black/.1@light b:white/.2@dark': !props.disabled
        })}>
            {props.children}
        </Link>
    )
}
