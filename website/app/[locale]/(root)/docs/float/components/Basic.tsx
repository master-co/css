import Demo from 'websites-shared/components/Demo'
import DemoPanel from 'websites-shared/components/DemoPanel'
import Image from 'next/image'
import { l } from 'to-line'
import Code from 'websites-shared/components/Code'

export default ({ className }: any) => {
    return (
        <>
            <Demo $py={0}>
                <DemoPanel>
                    <Image className={l(className, 'r:8 object:cover mt:6 mb:16', {
                        'mr:30': className === 'float:left',
                        'ml:30': className === 'float:right'
                    })} src="/images/blur.png" width={160} height={90} alt="Float Image" />
                    <p className="text-align:justify my:0">
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