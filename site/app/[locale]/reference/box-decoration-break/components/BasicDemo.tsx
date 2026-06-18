import Demo from 'internal/components/Demo'
import clsx from 'clsx'

export default ({ className }: any) => {
    return (
        <Demo>
            <div className='flex:0'>
                <span className={clsx(
                    className,
                    'bg:linear-gradient(90deg,#FAD961|0%,#F76B1C|100%) pi:3x fg:white font:32px font:extrabold tracking:tight'
                )}>
                    Box Decoration Break
                </span>
            </div>
        </Demo>
    )
}
