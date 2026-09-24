import { IconSun } from '@tabler/icons-react'

export default (props: any) =>
  <div className="w:50% light">
    <div className="overflow:hidden background:var(--stripe) surface-raised">
      <IconSun className='abs left-md top-md font-xs text-subtle' strokeWidth={1} width={24} height={24}/>
      <div className="float:right py-2xl transform:translateX(50%)">
        {props.children}
      </div>
    </div>
  </div>
