import Demo from 'websites/components/Demo'
import DemoPanel from 'websites/components/DemoPanel'
import Code from 'websites/components/Code'
import clsx from 'clsx'

export default ({ className }: any) => {
    return (
        <>
            <Demo className="gap:40">
                <button className="bg-stripe cursor:pointer font:14 font:semibold h:42 px:20 r:5">Hover Me</button>
            </Demo>
            <Code lang="html">{`
                <div class="**${className}**">Hover Me</div>
            `}</Code>
        </>
    )
}