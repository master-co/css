import Image from 'next/image'
import Demo from 'internal/components/Demo'
import DemoPanel from 'internal/components/DemoPanel'
import clsx from 'clsx'

export default function BasicDemo({ className }: any) {
    return (
        <Demo $py={0}>
            <DemoPanel>
                <Image className={clsx(className, 'r:8 mb:16 mt:6 object:cover', {
                    'mr:30': className === 'float:left',
                    'ml:30': className === 'float:right'
                })} src="/images/blur.png" width={160} height={90} alt="Float Image" />
                <p className="my:0 text-align:justify">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et elit dictum, tempor augue quis, rhoncus enim. Nunc lacinia, velit vel convallis tincidunt, ante nisi maximus nunc, at aliquam nisi lectus in mauris. Nam eros sem, ullamcorper nec mollis nec, imperdiet a metus.
                </p>
            </DemoPanel>
        </Demo>
    )
}