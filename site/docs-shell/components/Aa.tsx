import clsx from 'clsx'

export default function Aa(props: any) {
  return <span {...props} className={clsx(
    'mr-sm font-md font-weight:460 user-select:none vertical-align:top',
    props.className,
    {
      'background-image:var(--tiny-image) background-position:center': props.className.includes('-webkit-text-fill-color:transparent'),
      '-webkit-text-stroke-width:1px -webkit-text-stroke-color:currentColor': props.className.includes('fg-text-inverse')
    }
  )} style={{ paintOrder: props.className.includes('fg-text-inverse') ? 'stroke fill' : undefined }}>Aa</span>
}
