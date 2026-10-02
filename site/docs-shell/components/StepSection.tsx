import styled from '@master/styled.react'

const StepSection = styled.div`
  mt-2xl
  counter-reset:step
  margin-block:1.875rem_hr
  margin-bottom:0_.code:last-child
  margin-left:-44.5px_:is(h2,h3,h4)
  margin-left:0_.codeTabs_.code
  margin-top:0_:is(h2,h3,h4)
  text-sm_:is(li,p)
  font-size:16px_:is(h2,h3,h4)
  font-weight:460_:is(h2,h3,h4)
  user-select:text_a
  margin-left:-2.781rem_:is(.code,.codeTabs,.demo)@media((width<64rem))
`

export const StepNum = styled.div`
  display:inline-flex align-items:center
  justify-content:center
  height:24px width:24px margin-right:1.281rem r-sm border-width:1px border-style:solid b-line-subtle font-xs font-weight:460 tracking-normal bg-surface-raised counter-increment:step vertical-align:middle
  content:counter(step):before
`

export const StepEnd = styled.div`
  position:absolute left-2xl bottom:0 height:10px width:10px aspect-ratio:1/1 border-radius:50% border-width:1px border-style:solid b-line-subtle
  bg-surface-raised
  box-shadow:0|0.1px|0.3px|rgba(0,0,0,0.024),0|0.4px|0.9px|rgba(0,0,0,0.036),0|1px|1px|rgba(0,0,0,0.06)
  transform:translate(-4px,4px) display:none@media((width<64rem))
`

export const Step = styled.div(
  'position:relative margin-left:0.938rem pl-xl border-left-width:1px border-left-style:solid bl-line-subtle margin-left:-3.125rem:last-child>*:last-child pb-xl:not(:last-child)',
  ({ $row }) => $row && `display:flex flex-wrap:wrap@media((width<64rem)) row-gap:2rem@md column-gap:2.5rem@md`
)

export const StepL = styled.div`flex-grow:1 flex-shrink:1 flex-basis:100% min-width:0 margin-bottom:0>:last-child flex-grow:1@md flex-shrink:1@md flex-basis:40%@md`
export const StepR = styled.div`flex-grow:1 flex-shrink:1 flex-basis:100% min-width:0 margin-top:0>:first-child flex-grow:1@md flex-shrink:1@md flex-basis:60%@md`

export default StepSection
