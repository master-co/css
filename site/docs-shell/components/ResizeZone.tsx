import clsx from 'clsx'
import Resizable from './Resizable'

export default function ResizeZone(props: any) {
  return (
    <div className={clsx('flex', {
      'items-center': props.originY === 'center',
      'justify-center': props.originX === 'center',
    })}>
      <Resizable {...props} />
    </div>
  )
}
