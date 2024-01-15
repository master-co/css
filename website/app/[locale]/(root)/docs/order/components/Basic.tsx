import Code from 'websites/components/Code'
import clsx from 'clsx'
import Demo from 'websites/components/Demo'
import DemoPanel from 'websites/components/DemoPanel'

export default ({ className }: any) => {
    return (
        <>
            <Demo>
                <div className="flex gap:10">
                    <div className="app-box neutral">1</div>
                    <div className={clsx(className, 'app-box accent')}>2</div>
                    <div className="app-box neutral">3</div>
                </div>
            </Demo>
            <Code lang="html">{`
                <div class="flex">
                    <div>1</div>
                    <div class="**${className}**">2</div>
                    <div>3</div>
                </div>
            `}</Code>
        </>
    )
}