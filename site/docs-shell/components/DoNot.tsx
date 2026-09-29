import { IconCircleX } from '@tabler/icons-react'

export default function DoNot({ children }: any) {
  return (
    <p className="display:flex mt-lg">
      <span className="position:relative flex-grow:0 flex-shrink:0 flex-basis:auto mr-xs margin-left:-0.25rem">
        {/* <svg className='position:absolute top:auto right:0 bottom:-0.875rem left:0  margin:auto bg-crimson-40/.3 height:calc(100%-14px) width:1px'></svg> */}
        <IconCircleX width="1.25em" height="1.25em" className="position:relative display:inline-flex fill-crimson-40/.15 stroke-crimson-40 stroke-width:1.2 vertical-align:text-top" />
      </span>
      <span>{children}</span>
    </p>
  )
}
