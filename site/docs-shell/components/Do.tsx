import { IconCircleCheck } from '@tabler/icons-react'

export default function Do({ children }: any) {
  return (
    <p className="flex mt-lg">
      <span className="relative basis-auto grow(0) shrink(0) mr-xs (margin-left:-0.25rem)">
        {/* <svg className='abss top-auto right(0) (bottom:-0.875rem) left(0) m-auto bg-green-40/.3 (height:calc(100%-14px)) w(1)'></svg> */}
        <IconCircleCheck width="1.25em" height="1.25em" className="relative inline-flex fill-green-40/.15 stroke-green-40 (stroke-width:1.2) vertical-text-top" />
      </span>
      <span>{children}</span>
    </p>
  )
}
