import { IconCircleX } from '@tabler/icons-react'

export default function DoNot({ children }: any) {
  return (
    <p className="flex mt:lg">
      <span className="rel flex:0|0|auto ml:-1x mr:xs">
        {/* <svg className='abs inset:auto|0|-0.875rem|0  m:auto bg:crimson-40/.3 h:calc(100%-14px) w:1px'></svg> */}
        <IconCircleX width="1.25em" height="1.25em" className="rel inline-flex fill:crimson-40/.15 stroke:crimson-40 stroke:1.2 vertical-align:text-top" />
      </span>
      <span>{children}</span>
    </p>
  )
}
