import Code from '~/site/docs-shell/components/Code'

export default ({ className }: any) => {
  return (
    <>
      <Code lang="html">{`
        <div class="flex">
          <div>1</div>
          <!-- @MARK ${className} -->
          <div class="${className}">2</div>
          <div>3</div>
        </div>
      `}</Code>
    </>
  )
}