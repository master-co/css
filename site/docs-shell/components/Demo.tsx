import '~/site/styles/docs-shell/demo.css'
import styled from '@master/styled.react'

const Demo = styled.div(
  'demo',
  (({ $px = '3rem' }) => `padding-inline:2rem padding-inline:${$px}@sm`),
  (({ $py = '3rem' }) => `padding-block:2rem padding-block:${$py}@sm`),
)

export default Demo
