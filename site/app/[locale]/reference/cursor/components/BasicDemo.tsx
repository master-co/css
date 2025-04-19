import Demo from 'internal/components/Demo'
import clsx from 'clsx'

export default ({ className }: any) => {
    return (
        <Demo className="gap:40">
            <button className={clsx(className, 'bg:stripe r:5 px:20 font:14 font:medium h:42')}>Hover Me</button>
        </Demo>
    )
}