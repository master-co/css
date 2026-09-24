import Code from '~/site/docs-shell/components/Code'

export default ({ className }: any) => {
  return (
    <>
      <Code lang="html">{`
        <div class="columns:3 gap:8x">
          <p>There are many different types of animals, ...</p>
          <!-- @MARK ${className} -->
          <p class="${className} font:bold">No matter what type of animal ...</p>
          <p>Look at some of the most amazing creatures on earth, ...</p>
        </div>
      `}</Code>
    </>
  )
}