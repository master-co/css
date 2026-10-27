import { IconInfoCircle } from '@tabler/icons-react'

export default function Info({ children }: any) {
  return (
    <p className="display:flex mt-lg">
      <span className="position:relative flex-grow:0 flex-shrink:0 flex-basis:auto mr-xs margin-left:-0.25rem">
        {/* <svg className='position:absolute top:auto right:0 bottom:-0.875rem left:0 margin:auto bg-blue-40/.15 height:calc(100%-14px) width:1px'></svg> */}
        <IconInfoCircle width="1.25em" height="1.25em" className="display:inline-flex fill-blue-40/.15 stroke-blue-40 stroke-width:1.2 vertical-align:text-top" />
      </span>
      <span>{children}</span>
    </p>
  )
}
