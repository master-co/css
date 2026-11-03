import BehaviorSvg from '~/svgs/behavior.svg'
import ClickSvg from '~/svgs/click.svg'
import EyeSvg from '~/svgs/eye.svg'

export default function InteractingIndicator({ children, icon }: any) {
    const iconClass = 'my:-4 mr:5 fill:gray-40 fill:gray-60@dark'
    return (
        <div className="flex align-items:center font:medium font:14 mt:20 white-space:pre-wrap">
            {!icon && <BehaviorSvg width="24" height="24" className={iconClass} />}
            {icon === 'click' && <ClickSvg width="24" height="24" className={iconClass} />}
            {icon === 'observe' && <EyeSvg width="24" height="24" className={iconClass} />}
            {children}
        </div>
    )
}