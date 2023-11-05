import Link from 'websites-shared/components/Link'
import { l } from 'to-line'

export default (props: any) => {
    return (
        <Link {...props} className={l(`
            font:14 font:semibold px:15 h:44 my:10 center-content fg:white! flex text-decoration:none! r:5
        `, {
            'bg:primary@light bg:gold-70:hover@light bg:gold-70@dark bg:gold-60:hover@dark': !props.disabled,
            'bg:slate-95@light bg:gray-15@dark': props.disabled
        })}>
            {props.children}
        </Link>
    )
}