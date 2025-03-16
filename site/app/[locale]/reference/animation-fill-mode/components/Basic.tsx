import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) => {
    return (
        <>
            <BasicDemo className={className} />
            <Code lang="html">{`<svg class="**${className}** @slide-to-right|3s @delay:1s!">…</svg>`}</Code>
        </>
    )
}