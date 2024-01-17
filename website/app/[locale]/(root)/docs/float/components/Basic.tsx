import Demo from 'websites/components/Demo'
import DemoPanel from 'websites/components/DemoPanel'
import Image from 'next/image'
import clsx from 'clsx'
import Code from 'websites/components/Code'

export default ({ className }: any) => {
    return (
        <>
            <Demo $py={0}>
                <DemoPanel>
                    <Image className={clsx(className, 'r:8 object:cover mt:6 mb:16', {
                        'mr:30': className === 'float:left',
                        'ml:30': className === 'float:right'
                    })} src="/images/blur.png" width={160} height={90} alt="Float Image" />
                    <p className="my:0 text-align:justify">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et elit dictum, tempor augue quis, rhoncus enim. Nunc lacinia, velit vel convallis tincidunt, ante nisi maximus nunc, at aliquam nisi lectus in mauris. Nam eros sem, ullamcorper nec mollis nec, imperdiet a metus.
                    </p>
                </DemoPanel>
            </Demo>
            <Code lang="html">{`
                <img class="**${className}**" … />
                <p>Lorem ipsum dolor sit amet …</p>
            `}</Code>
        </>
    )
}