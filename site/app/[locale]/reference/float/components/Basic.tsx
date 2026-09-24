import Code from '~/site/docs-shell/components/Code'

export default ({ className }: any) => {
  return (
    <>
      <Code lang="html">{`
        <!-- @MARK ${className} -->
        <img class="${className}" ... />
        <p>Text wraps around the floated image.</p>
      `}</Code>
    </>
  )
}
