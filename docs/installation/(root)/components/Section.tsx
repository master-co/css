import { l } from 'to-line';
import Link from 'shared/components/Link'

export default ({ children, className }: any) =>
    <div className={l(className, 'grid-cols:3 grid-cols:5@sm grid-cols:8@md gap:10')}>{
        children.map((guide: any) =>
            <Link key={guide.name}
                className={l(
                    'app-object app-object-interactive flex:col square p:20|10 r:5 text:center',
                    {
                        'disabled': guide.disabled
                    }
                )}
                href={guide.url || `/docs/installation/${guide.path || guide.name.replace(' ', '-').toLowerCase()}`}
                target={guide.target}
                disabled={guide.disabled}
                rel="noreferrer noopener">
                <guide.Logo className={l`w:32 h:32 w:44@sm h:44@sm ${guide.class}`} />
                <div className="font:10 font:12@sm mt:10">{guide.name}</div>
            </Link>
        )
    }</div>