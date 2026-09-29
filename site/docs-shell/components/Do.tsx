import { IconCircleCheck } from '@tabler/icons-react'

export default function Do({ children }: any) {
  return (
    <p className="display:flex mt-lg">
      <span className="position:relative flex:0|0|auto mr-xs margin-left:-0.25rem">
        {/* <svg className='abss inset:auto|0|-0.875rem|0 margin:auto bg-green-40/.3 height:calc(100%-14px) width:1px'></svg> */}
        <IconCircleCheck width="1.25em" height="1.25em" className="position:relative display:inline-flex fill-green-40/.15 stroke-green-40 stroke-width:1.2 vertical-align:text-top" />
      </span>
      <span>{children}</span>
    </p>
  )
}
