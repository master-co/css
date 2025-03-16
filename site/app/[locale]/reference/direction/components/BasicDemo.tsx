import Demo from 'internal/components/Demo'
import DemoPanel from 'internal/components/DemoPanel'
import clsx from 'clsx'

export default ({ className }: any) => {
    return (
        <Demo $py={0}>
            <DemoPanel>
                <p className={clsx(className, 'm:0')}>There are a wide variety of animals in the world, and each one has its own unique set of characteristics and habits.</p>
            </DemoPanel>
        </Demo>
    )
}