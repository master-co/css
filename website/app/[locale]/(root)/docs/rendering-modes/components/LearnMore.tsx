import Link from 'websites/components/Link'
import { l } from 'to-line'

export default (props: any) => {
    return (
        <Link {...props} className={l(`
            font:14 font:semibold px:15 h:44 my:10 center-content flex text-decoration:none! r:5
        `, {
            'bg:primary fg:text-primary b:1 b:black/.1@light b:white/.2@dark': !props.disabled,
            'bg:slate-95@light bg:gray-15@dark': props.disabled
        })}>
            {props.children}
        </Link>
    )
}