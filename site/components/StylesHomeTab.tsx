import clsx from 'clsx';

export default function StylesHomeTab({ children, Icon, onMouseEnter, active, color = 'blue' }: any) {
    return (
        <button name={children} className={clsx(`homeTab f:${color}-70!.active`, { active })} onMouseEnter={onMouseEnter}>
            <Icon width="56" height="56" fill="currentColor" className="untouchable" />
            <div className="f:12 f:14@sm f:medium mt:15 untouchable">{children}</div>
        </button>
    )
}