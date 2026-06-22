import Demo from 'internal/components/Demo'
import DemoPanel from 'internal/components/DemoPanel'
import clsx from 'clsx'

export default ({ className }: any) =>
    <Demo $py={0}>
        <DemoPanel>
            <p className={clsx('my:0', className)}>
                <span className='rounded bg:stripe-pink'>
                    Alignment changes how each line sits inside the paragraph. Use it to match the reading direction, layout density, and rhythm of the surrounding content.
                </span>
            </p>
        </DemoPanel>
    </Demo>
