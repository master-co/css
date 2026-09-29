import { IconAlertCircle } from '@tabler/icons-react'

export default function Warn({ children }: any) {
  return (
    <p className="display:flex mt-lg">
      <span className="position:relative flex:0|0|auto mr-xs margin-left:-0.25rem">
        {/* <svg className='position:absolute inset:auto|0|-0.875rem|0 margin:auto bg-orange-40/.15 height:calc(100%-14px) width:1px'></svg> */}
        <IconAlertCircle width="1.25em" height="1.25em" className="position:relative display:inline-flex fill-orange-40/.15 stroke-orange-40 stroke-width:1.2 vertical-align:text-top" />
      </span>
      <span>{children}</span>
    </p>
  )
}
