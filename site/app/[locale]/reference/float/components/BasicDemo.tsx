import Image from 'next/image'
import Demo from 'internal/components/Demo'
import DemoPanel from 'internal/components/DemoPanel'
import clsx from 'clsx'

export default function BasicDemo({ className }: any) {
  return (
    <Demo $py={0}>
      <DemoPanel>
        <Image className={clsx(className, 'mb:md mt:2xs r:lg object-cover', {
          'mr:1.875rem': className === 'float:left',
          'ml:1.875rem': className === 'float:right'
        })} src="/images/blur.png" width={160} height={90} alt="Float Image" />
        <p className="my:0 text-justify">
          Text wraps around the floated image and continues in the remaining inline space. Reset the float when the image should return to normal document flow.
        </p>
      </DemoPanel>
    </Demo>
  )
}
