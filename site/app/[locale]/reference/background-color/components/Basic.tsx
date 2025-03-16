import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) =>
    <>
        <BasicDemo className={className} />
        <Code lang="html">{`<div class="**${className}**">…</div>`}</Code>
    </>