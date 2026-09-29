import clsx from 'clsx'
import { Demo, DemoItem } from '~/site/components/demo'

export default ({ className }: any) => {
  return (
    <Demo title="Visual order" caption="The blue item receives the selected order value. Equal values keep the source sequence: 01, 02, 03.">
      <div className="display:flex gap-sm">
        <DemoItem tone="neutral" className="display:grid flex:none place-items:center height:3rem width:3rem">01</DemoItem>
        <DemoItem tone="blue" className={clsx(className, 'display:grid flex:none place-items:center height:3rem width:3rem')}>02</DemoItem>
        <DemoItem tone="neutral" className="display:grid flex:none place-items:center height:3rem width:3rem">03</DemoItem>
      </div>
    </Demo>
  )
}
