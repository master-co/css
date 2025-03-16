import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) => {
    return (
        <>
            <BasicDemo className={className} />
            <Code lang="html">{`
                <svg class="**${className}** ${className.includes('running') ? '@float|3s|ease-in-out|infinite|paused' : '@float|3s|ease-in-out|infinite'}">…</svg>
            `}</Code>
        </>
    )
}