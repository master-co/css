import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) => {
    if (className === 'box-decoration:slice') {
        className += ' rbr:2x rtl:2x'
    }
    return (
        <>
            <BasicDemo className={className} />
            <Code lang="html">{`<span class="**${className}**">Box Decoration Break</span>`}</Code>
        </>
    )
}