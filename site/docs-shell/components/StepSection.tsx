import styled from '@master/styled.react'

const StepSection = styled.div`
  mt:2xl
  {counter-reset:step}
  {font:16px;margin-left:-44.5px;mt:0;font-weight:460}_:is(h2,h3,h4)
  my:1.875rem_hr
  mb:0_.code:last
  ml:0_.codeTabs_.code
  text:sm_:is(li,p)
  user-select:text_a
  ml:-2.781rem_:is(.code,.codeTabs,.demo)@<md
`

export const StepNum = styled.div`
  inline-flex items-center
  justify-center
  size:24px mr:1.281rem b:1px|solid|muted r:sm font-weight:460 font:xs tracking:normal surface:raised counter-increment:step vertical-align:middle
  content:counter(step):before
`

export const StepEnd = styled.div`
  abs bottom left:2xl size:10px round b:1px|solid|muted
  surface:raised
  transform:translate(-4px,4px)
  hidden@<md shadow:0|0.1px|0.3px|rgba(0,0,0,0.024px),0|0.4px|0.9px|rgba(0,0,0,0.036px),0|1px|1px|rgba(0,0,0,0.06px)
`

export const Step = styled.div(
  'rel ml:0.938rem pl:xl bl:1px|solid|muted ml:-3.125rem:last>*:last pb:xl:not(:last)',
  ({ $row }) => $row && `flex flex-wrap@<md gap:8x|10x@md`
)

export const StepL = styled.div`flex:1|1|100% min-w:0 mb:0>:last flex:1|1|40%@md`
export const StepR = styled.div`flex:1|1|100% min-w:0 mt:0>:first flex:1|1|60%@md`

export default StepSection
