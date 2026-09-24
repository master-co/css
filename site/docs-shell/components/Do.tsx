import { IconCircleCheck } from '@tabler/icons-react'

export default function Do({ children }: any) {
  return (
    <p className="flex mt:lg">
      <span className="rel flex:0|0|auto ml:-1x mr:xs">
        {/* <svg className='abss inset:auto|0|-0.875rem|0 m:auto bg:green-40/.3 h:calc(100%-14px) w:1px'></svg> */}
        <IconCircleCheck width="1.25em" height="1.25em" className="rel inline-flex fill:green-40/.15 stroke:green-40 stroke:1.2 vertical-align:text-top" />
      </span>
      <span>{children}</span>
    </p>
  )
}
