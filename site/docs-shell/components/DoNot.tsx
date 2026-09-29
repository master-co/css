import { IconCircleX } from '@tabler/icons-react'

export default function DoNot({ children }: any) {
  return (
    <p className="display:flex mt-lg">
      <span className="position:relative flex:0|0|auto mr-xs margin-left:-0.25rem">
        {/* <svg className='position:absolute inset:auto|0|-0.875rem|0  margin:auto bg-crimson-40/.3 height:calc(100%-14px) width:1px'></svg> */}
        <IconCircleX width="1.25em" height="1.25em" className="position:relative display:inline-flex fill-crimson-40/.15 stroke-crimson-40 stroke-width:1.2 vertical-align:text-top" />
      </span>
      <span>{children}</span>
    </p>
  )
}
