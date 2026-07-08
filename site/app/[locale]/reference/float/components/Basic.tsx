import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) => {
  return (
    <>
      <BasicDemo className={className} />
      <Code lang="html">{`
        <!-- @MARK ${className} -->
        <img class="${className}" ... />
        <p>Text wraps around the floated image.</p>
      `}</Code>
    </>
  )
}
