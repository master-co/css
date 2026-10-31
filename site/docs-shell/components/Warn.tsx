import { IconAlertCircle } from '@tabler/icons-react'

export default function Warn({ children }: any) {
  return (
    <p className="flex mt-lg">
      <span className="relative (flex-basis:auto) (flex-grow:0) (flex-shrink:0) mr-xs (margin-left:-0.25rem)">
        {/* <svg className='absolute (top:auto) (right:0) (bottom:-0.875rem) (left:0) (margin:auto) bg-orange-40/.15 (height:calc(100%-14px)) (width:1px)'></svg> */}
        <IconAlertCircle width="1.25em" height="1.25em" className="relative inline-flex fill-orange-40/.15 stroke-orange-40 (stroke-width:1.2) (vertical-align:text-top)" />
      </span>
      <span>{children}</span>
    </p>
  )
}
