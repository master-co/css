import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) => {
    return (
        <>
            <BasicDemo className={className} />
            <Code lang="html">{`
                <div class="cols:3 gap:8x">
                    <p>There are many different types of animals, ...</p>
                    <!-- @MARK ${className} -->
                    <p class="${className} font:bold">No matter what type of animal ...</p>
                    <p>Look at some of the most amazing creatures on earth, ...</p>
                </div>
            `}</Code>
        </>
    )
}