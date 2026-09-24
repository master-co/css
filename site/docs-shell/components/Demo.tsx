import styled from '@master/styled.react'

const Demo = styled.div(
  'demo',
  (({ $px = '12x' }) => `px:8x px:${$px}@sm`),
  (({ $py = '12x' }) => `py:8x py:${$py}@sm`),
)

export default Demo
