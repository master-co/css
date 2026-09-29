import { Demo, DemoItem, DemoSurface, DemoText } from '~/site/components/demo'
import clsx from 'clsx'

export default function BasicDemo({ className }: { className?: string }) {
  return (
    <Demo title="Column flow" caption="Choose all or none in the syntax table to change how the blue block participates in this two-column flow.">
      <DemoSurface className="p-md font-size-sm">
        <div className="gap-md columns:2">
          <DemoText className="margin-inline:0 mb-sm margin-top:0">Start with the collection overview and its key details.</DemoText>
          <DemoItem tone="blue" className={clsx(className, 'my-sm p-sm font-weight-medium')}>Collection notes</DemoItem>
          <DemoText className="margin:0">Continue through each column in reading order, then move to the next section.</DemoText>
        </div>
      </DemoSurface>
    </Demo>
  )
}
