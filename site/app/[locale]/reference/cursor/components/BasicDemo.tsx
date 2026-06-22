import Demo from 'internal/components/Demo'
import clsx from 'clsx'

export default ({ className }: any) => {
    return (
        <Demo className="gap:10x">
            <button className={clsx(className, 'bg:stripe r:5px px:5x font:14px font:medium h:42px')}>Hover Me</button>
        </Demo>
    )
}