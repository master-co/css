import styled from '@master/styled.react'

const StepSection = styled.div`
  mt-2xl
  {counter-reset:step}
  margin-block:1.875rem_hr
  margin-bottom:0_.code:last
  margin-left:0_.codeTabs_.code
  text-sm_:is(li,p)
  {font-size:16px;margin-left:-44.5px;margin-top:0;font-weight:460}_:is(h2,h3,h4)
  user-select:text_a
  margin-left:-2.781rem_:is(.code,.codeTabs,.demo)@media((width<64rem))
`

export const StepNum = styled.div`
  display:inline-flex align-items:center
  justify-content:center
  height:24px width:24px margin-right:1.281rem r-sm border:1px|solid|var(--color-line-subtle) font-xs font-weight:460 tracking-normal bg-surface-raised counter-increment:step vertical-align:middle
  content:counter(step):before
`

export const StepEnd = styled.div`
  position:absolute left-2xl bottom:0 height:10px width:10px aspect-ratio:1/1 border-radius:50% border:1px|solid|var(--color-line-subtle)
  bg-surface-raised
  box-shadow:0|0.1px|0.3px|rgba(0,0,0,0.024),0|0.4px|0.9px|rgba(0,0,0,0.036),0|1px|1px|rgba(0,0,0,0.06)
  transform:translate(-4px,4px) display:none@media((width<64rem))
`

export const Step = styled.div(
  'position:relative margin-left:0.938rem pl-xl border-left:1px|solid|var(--color-line-subtle) margin-left:-3.125rem:last>*:last pb-xl:not(:last)',
  ({ $row }) => $row && `display:flex flex-wrap:wrap@media((width<64rem)) gap:2rem|2.5rem@md`
)

export const StepL = styled.div`flex:1|1|100% min-width:0 margin-bottom:0>:last flex:1|1|40%@md`
export const StepR = styled.div`flex:1|1|100% min-width:0 margin-top:0>:first flex:1|1|60%@md`

export default StepSection
