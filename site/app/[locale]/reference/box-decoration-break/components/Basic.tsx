import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) => {
    if (className === 'box-decoration-break:slice') {
        className += ' border-bottom-right-radius:2x border-top-left-radius:2x'
    }
    return (
        <>
            <BasicDemo className={className} />
            <Code lang="html">{`
                <!-- @MARK ${className} -->
                <span class="${className}">Box Decoration Break</span>
            `}</Code>
        </>
    )
}
