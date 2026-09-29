import clsx from 'clsx'
import Resizable from './Resizable'

export default function ResizeZone(props: any) {
  return (
    <div className={clsx('display:flex', {
      'align-items:center': props.originY === 'center',
      'justify-content:center': props.originX === 'center',
    })}>
      <Resizable {...props} />
    </div>
  )
}
