import clsx from 'clsx'

export default function Aa(props: any) {
  return <span {...props} className={clsx(
    'mr-sm font-weight:460 font-md user-select:none vertical-align:top',
    props.className,
    {
      'background:var(--tiny)': props.className.includes('text-fill-color:transparent'),
      'text-stroke:1px|currentColor': props.className.includes('text-inverse')
    }
  )} style={{ paintOrder: props.className.includes('text-inverse') ? 'stroke fill' : undefined }}>Aa</span>
}
