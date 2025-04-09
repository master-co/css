import Demo from 'internal/components/Demo'
import clsx from 'clsx'

export default ({ className }: any) => {
    return (
        <Demo>
            <div className='flex:0'>
                <span className={clsx(
                    className,
                    'gradient(90deg,#FAD961|0%,#F76B1C|100%) px:3x fg:white font:32 font:extrabold tracking:-.25'
                )}>
                    Box Decoration Break
                </span>
            </div>
        </Demo>
    )
}