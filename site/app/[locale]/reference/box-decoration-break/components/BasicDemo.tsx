import Demo from 'internal/components/Demo'
import clsx from 'clsx'

export default ({ className }: any) => {
  return (
    <Demo>
      <div className='flex:0'>
        <span className={clsx(
          className,
          'px:sm font:3xl font:extrabold tracking:tight bg:linear-gradient(90deg,#FAD961|0%,#F76B1C|100%) fg:white'
        )}>
          Box Decoration Break
        </span>
      </div>
    </Demo>
  )
}
