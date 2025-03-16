import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) => {
    return (
        <>
            <BasicDemo className={className} />
            <Code lang="html">{`
                <div class="**${className}**">Hover Me</div>
            `}</Code>
        </>
    )
}