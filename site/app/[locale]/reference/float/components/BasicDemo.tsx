import { Demo, DemoMedia, DemoSurface, DemoText } from '~/site/components/demo'
import clsx from 'clsx'

export default function BasicDemo({ className }: { className?: string }) {
  return (
    <Demo title="Text flow" caption="Choose a float value in the syntax table to move the same image within this paragraph.">
      <DemoSurface className="display:flow-root p-md font-size-sm">
        <DemoMedia className={clsx(className, 'height:auto width:7rem mb-sm r-sm', {
          'mr-md': className === 'float:left',
          'ml-md': className === 'float:right'
        })} src="/demo/landscape.svg" width={112} height={70} alt="Sun above layered mountains" />
        <DemoText className="margin:0">
          Text wraps around the floated image and continues in the remaining inline space. Reset the float when the image should return to normal document flow.
        </DemoText>
      </DemoSurface>
    </Demo>
  )
}
