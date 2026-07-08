import Code from 'internal/components/Code'
import BasicDemo from './BasicDemo'

export default ({ className }: any) => {
  return (
    <>
      <BasicDemo className={className} />
      <Code lang="html">{`
        <!-- @MARK ${className} -->
        <svg class="${className} animation:slide-to-right|3s animation-delay:1s!">…</svg>
      `}</Code>
    </>
  )
}