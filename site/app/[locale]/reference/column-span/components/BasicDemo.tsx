import Demo from 'internal/components/Demo'
import DemoPanel from 'internal/components/DemoPanel'
import clsx from 'clsx'

export default ({ className }: any) => {
    return (
        <Demo $py={0}>
            <DemoPanel>
                <div className="gap:xl columns:3">
                    <p className="m:0">There are many different types of animals, each with unique characteristics.</p>
                    <p className={clsx(className, 'font:bold text:neutral')}>No matter what type of animal you are interested in, you will find something interesting and informative here.</p>
                    <p className="m:0">Look at some of the most amazing creatures on earth, from spiders to whales!</p>
                </div>
            </DemoPanel>
        </Demo>
    )
}