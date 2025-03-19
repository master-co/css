import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) =>
    <>
        <BasicDemo className={className} />
        <Code lang="html">{`
            <!-- @MARK ${className} -->
            <div class="${className}">…</div>
        `}</Code>
    </>