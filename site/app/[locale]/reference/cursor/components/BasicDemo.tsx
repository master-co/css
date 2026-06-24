import Demo from 'internal/components/Demo'
import clsx from 'clsx'

export default ({ className }: any) => {
    return (
        <Demo className="gap:10x">
            <button className={clsx(className, 'bg:stripe px:5x r:5px font:medium font:sm h:42px')}>Hover Me</button>
        </Demo>
    )
}