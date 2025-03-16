import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) => {
    return (
        <>
            <BasicDemo className={className} />
            <Code lang="html">{`
                <img class="**${className}**" … />
                <p>Lorem ipsum dolor sit amet …</p>
            `}</Code>
        </>
    )
}