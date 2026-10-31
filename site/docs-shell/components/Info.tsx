import { IconInfoCircle } from '@tabler/icons-react'

export default function Info({ children }: any) {
  return (
    <p className="flex mt-lg">
      <span className="relative basis-auto grow(0) shrink(0) mr-xs (margin-left:-0.25rem)">
        {/* <svg className='absolute top-auto right(0) (bottom:-0.875rem) left(0) m-auto bg-blue-40/.15 (height:calc(100%-14px)) w(1)'></svg> */}
        <IconInfoCircle width="1.25em" height="1.25em" className="inline-flex fill-blue-40/.15 stroke-blue-40 (stroke-width:1.2) vertical-text-top" />
      </span>
      <span>{children}</span>
    </p>
  )
}
