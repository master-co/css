import clsx from 'clsx'
import { Demo, DemoItem } from '~/site/components/demo'

export default ({ className }: any) => {
  return (
    <Demo title="Visual order" caption="The blue item receives the selected order value. Equal values keep the source sequence: 01, 02, 03.">
      <div className="flex gap:sm">
        <DemoItem tone="neutral" className="grid flex:none place-items:center size:12x">01</DemoItem>
        <DemoItem tone="blue" className={clsx(className, 'grid flex:none place-items:center size:12x')}>02</DemoItem>
        <DemoItem tone="neutral" className="grid flex:none place-items:center size:12x">03</DemoItem>
      </div>
    </Demo>
  )
}
