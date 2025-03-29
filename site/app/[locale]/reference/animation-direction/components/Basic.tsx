import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default (props: any) => {
    return (
        <>
            <BasicDemo {...props} />
            <Code lang="html">{`
                <!-- @MARK ${props.className} -->
                <svg class="${props.className} @rotate|1s|linear|infinite">…</svg>
            `}</Code>
        </>
    )
}