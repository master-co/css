import { IconAlertCircle } from '@tabler/icons-react'

export default function Warn({ children }: any) {
  return (
    <p className="flex mt:lg">
      <span className="rel flex:0|0|auto ml:-1x mr:xs">
        {/* <svg className='abs inset:auto|0|-0.875rem|0 m:auto bg:orange-40/.15 h:calc(100%-14px) w:1px'></svg> */}
        <IconAlertCircle width="1.25em" height="1.25em" className="rel inline-flex fill:orange-40/.15 stroke:orange-40 stroke:1.2 vertical-align:text-top" />
      </span>
      <span>{children}</span>
    </p>
  )
}
