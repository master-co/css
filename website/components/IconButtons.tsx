import { l } from 'to-line'
import Link from 'websites/components/Link'

export default ({ children, className, url }: any) =>
    <div className={l(className, 'grid-cols:3 grid-cols:5@sm grid-cols:8@md gap:10')}>{
        children.map((item: any) =>
            <Link key={item.name}
                className={l(
                    'app-object app-object-interactive flex:col square p:20|10 r:5 text:center',
                    {
                        'disabled': item.disabled
                    }
                )}
                href={item.url || `${url}/${item.path || item.name.replace(' ', '-').toLowerCase()}`}
                target={item.target}
                disabled={item.disabled}
                rel="noreferrer noopener">
                <item.Logo className={l`w:32 h:32 w:44@sm h:44@sm ${item.class}`} />
                <div className={l('font:10 mt:10', item.name.length < 17 && 'font:12@sm')}>{item.name}</div>
            </Link>
        )
    }</div >