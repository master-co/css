import '~/site/styles/docs-shell/demo.css'
import styled from '@master/styled.react'

const Demo = styled.div(
  'demo',
  (({ $px = '3rem' }) => `px:2rem px:${$px}@sm`),
  (({ $py = '3rem' }) => `py:2rem py:${$py}@sm`),
)

export default Demo
