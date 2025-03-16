import Demo from 'internal/components/Demo'
import clsx from 'clsx'

export default ({ className }: any) => {
    return (
        <Demo className="gap:40">
            <button className={clsx(className, 'bg:stripe font:14 font:semibold h:42 px:20 r:5')}>Hover Me</button>
        </Demo>
    )
}