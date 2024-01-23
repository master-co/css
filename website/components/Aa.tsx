import clsx from 'clsx'

export default function Aa(props: any) {
    return <span {...props} className={clsx('font:16 font:medium mr:3x v:top', props.className, { 'bg:tiny': props.className === 'fg:transparent' })}>Aa</span>
}