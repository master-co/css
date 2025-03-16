import Demo from 'internal/components/Demo'
import DemoPanel from 'internal/components/DemoPanel'
import clsx from 'clsx'

export default ({ className }: any) =>
    <Demo $py={0}>
        <DemoPanel>
            <p className={clsx('my:0', className)}>
                <span className='rounded bg:stripe-pink'>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et elit dictum, tempor augue quis, rhoncus enim. Nunc lacinia, velit vel convallis tincidunt, ante nisi maximus nunc, at aliquam nisi lectus in mauris.
                </span>
            </p>
        </DemoPanel>
    </Demo>
