import { Demo, DemoItem, DemoSurface, DemoText } from '~/site/components/demo'
import clsx from 'clsx'

export default function BasicDemo({ className }: { className?: string }) {
  return (
    <Demo title="Column flow" caption="Choose all or none in the syntax table to change how the blue block participates in this two-column flow.">
      <DemoSurface className="p:md font:sm">
        <div className="gap:md columns:2">
          <DemoText className="mx:0 mb:sm mt:0">Start with the collection overview and its key details.</DemoText>
          <DemoItem tone="blue" className={clsx(className, 'my:sm p:sm font:medium')}>Collection notes</DemoItem>
          <DemoText className="m:0">Continue through each column in reading order, then move to the next section.</DemoText>
        </div>
      </DemoSurface>
    </Demo>
  )
}
