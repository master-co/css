import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) => <>
  <BasicDemo className={className} />
  <Code lang="html">{`
    <!-- @MARK ${className} -->
    <p class="${className}">Alignment changes how each line sits inside the paragraph.</p>
  `}</Code>
</>
