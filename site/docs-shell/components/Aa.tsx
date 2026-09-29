import clsx from 'clsx'

export default function Aa(props: any) {
  return <span {...props} className={clsx(
    'mr-sm font-md font-weight:460 user-select:none vertical-align:top',
    props.className,
    {
      'background:var(--tiny)': props.className.includes('-webkit-text-fill-color:transparent'),
      '-webkit-text-stroke:1px|currentColor': props.className.includes('fg-text-inverse')
    }
  )} style={{ paintOrder: props.className.includes('fg-text-inverse') ? 'stroke fill' : undefined }}>Aa</span>
}
