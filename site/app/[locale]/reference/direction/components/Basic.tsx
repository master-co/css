import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) => {
    return (
        <>
            <BasicDemo className={className} />
            <Code lang="html">{`<p class="**${className}**">There are a wide variety of animals in the world …</p>`}</Code>
        </>
    )
}