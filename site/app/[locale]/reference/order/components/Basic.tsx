import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) => {
    return (
        <>
            <BasicDemo className={className} />
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