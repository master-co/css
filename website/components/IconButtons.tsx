import clsx from 'clsx'
import Image from 'next/image'
import Link from 'websites/components/Link'

export default ({ children, className, url }: any) =>
    <div className={clsx(className, 'gap:10 grid-cols:3 grid-cols:6@sm grid-cols:8@lg mt:4x')}>{
        children.map((item: any) =>
            <Link key={item.name}
                className={clsx(
                    'app-object app-object-interactive square flex:col p:20|10 r:5 text:center',
                    {
                        'disabled': item.disabled
                    }
                )}
                href={item.url || `${url}/${item.path || item.name.replace(' ', '-').toLowerCase()}`}
                target={item.target}
                disabled={item.disabled}
                rel="noreferrer noopener">
                <Image className={clsx('square w:40%', item.className)} src={item.src} alt={item.name} width={48} height={48} />
                <div className={clsx('font:10 mt:10', item.name.length < 17 && 'font:12@sm', item.disabled && 'fg:lightest')}>{item.name}</div>
            </Link>
        )
    }</div >