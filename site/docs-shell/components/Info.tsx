import { IconInfoCircle } from '@tabler/icons-react'

export default function Info({ children }: any) {
  return (
    <p className="flex mt-lg">
      <span className="rel flex:0|0|auto ml:-0.25rem mr-xs">
        {/* <svg className='abs inset:auto|0|-0.875rem|0 m:auto bg-blue-40/.15 h:calc(100%-14px) w:1px'></svg> */}
        <IconInfoCircle width="1.25em" height="1.25em" className="inline-flex fill-blue-40/.15 stroke-blue-40 stroke-width:1.2 vertical-align:text-top" />
      </span>
      <span>{children}</span>
    </p>
  )
}
