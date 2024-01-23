import { IconSun } from '@tabler/icons-react'

export default (props: any) =>
    <div className="light w:1/2">
        <div className="bg-stripe bg:base overflow:hidden">
            <IconSun className='abs fg:lighter font:12 left:4x top:4x' strokeWidth={1} width={24} height={24}/>
            <div className="float:right py:8x translateX(50%)">
                {props.children}
            </div>
        </div>
    </div>